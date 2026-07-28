"""根据 park_areas.json 范围拉取高德卫星瓦片，生成贴图 / 法线 / 位移图。"""
from __future__ import annotations

import json
import math
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GEO_JSON = ROOT / "src/assets/park_areas.json"
CACHE_DIR = ROOT / "public/geo/_tile_cache"
OUT_MAP = ROOT / "src/assets/park_map.png"
OUT_NORMAL = ROOT / "src/assets/park_normal_map.png"
OUT_DISP = ROOT / "src/assets/park_displacement_map.png"

ZOOM = 14
PAD_RATIO = 0.0
MAX_EDGE = 1800
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def log(msg: str) -> None:
    print(msg, flush=True)


def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[float, float]:
    n = 2.0**z
    x = (lon + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    return x, y


def feature_bbox(geo: dict) -> tuple[float, float, float, float]:
    minx = miny = float("inf")
    maxx = maxy = float("-inf")
    for feat in geo["features"]:
        for poly in feat["geometry"]["coordinates"]:
            for ring in poly:
                for lng, lat in ring:
                    minx = min(minx, lng)
                    maxx = max(maxx, lng)
                    miny = min(miny, lat)
                    maxy = max(maxy, lat)
    return minx, miny, maxx, maxy


def tile_url(z: int, x: int, y: int) -> str:
    host = 1 + (x + y) % 4
    return (
        f"https://webst0{host}.is.autonavi.com/appmaptile"
        f"?style=6&x={x}&y={y}&z={z}"
    )


def fetch_tile(z: int, x: int, y: int) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{z}_{x}_{y}.jpg"
    if path.exists() and path.stat().st_size > 1000:
        return path
    url = tile_url(z, x, y)
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Referer": "https://www.amap.com/"}
    )
    last_err: Exception | None = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
            if len(data) < 500:
                raise RuntimeError(f"tiny tile {len(data)}")
            path.write_bytes(data)
            return path
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(0.35 * (attempt + 1))
    raise RuntimeError(f"failed {z}/{x}/{y}: {last_err}")


def stitch_tiles(z: int, x0: int, y0: int, x1: int, y1: int) -> Image.Image:
    w = (x1 - x0 + 1) * 256
    h = (y1 - y0 + 1) * 256
    canvas = Image.new("RGB", (w, h), (20, 30, 40))
    jobs = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    log(f"tiles: {len(jobs)} ({x0},{y0})-({x1},{y1}) z={z}")

    done = 0

    def work(item: tuple[int, int]):
        x, y = item
        return x, y, fetch_tile(z, x, y)

    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = [pool.submit(work, j) for j in jobs]
        for fut in as_completed(futs):
            x, y, path = fut.result()
            tile = Image.open(path).convert("RGB")
            canvas.paste(tile, ((x - x0) * 256, (y - y0) * 256))
            done += 1
            if done % 20 == 0 or done == len(jobs):
                log(f"  downloaded {done}/{len(jobs)}")
    return canvas


def crop_to_bbox(
    mosaic: Image.Image,
    z: int,
    x0: int,
    y0: int,
    west: float,
    south: float,
    east: float,
    north: float,
) -> Image.Image:
    tx0, ty0 = lonlat_to_tile(west, north, z)
    tx1, ty1 = lonlat_to_tile(east, south, z)
    left = int((tx0 - x0) * 256)
    top = int((ty0 - y0) * 256)
    right = int((tx1 - x0) * 256)
    bottom = int((ty1 - y0) * 256)
    left = max(0, left)
    top = max(0, top)
    right = min(mosaic.width, right)
    bottom = min(mosaic.height, bottom)
    return mosaic.crop((left, top, right, bottom))


def make_normal(rgb: Image.Image) -> Image.Image:
    gray = np.asarray(ImageOps.grayscale(rgb).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32)
    dx = np.zeros_like(gray)
    dy = np.zeros_like(gray)
    dx[:, 1:-1] = (gray[:, :-2] - gray[:, 2:]) / 255.0
    dy[1:-1, :] = (gray[:-2, :] - gray[2:, :]) / 255.0
    strength = 2.5
    dx *= strength
    dy *= strength
    dz = np.ones_like(gray)
    inv = 1.0 / np.sqrt(dx * dx + dy * dy + dz * dz)
    nx = ((dx * inv) * 0.5 + 0.5) * 255.0
    ny = ((dy * inv) * 0.5 + 0.5) * 255.0
    nz = ((dz * inv) * 0.5 + 0.5) * 255.0
    arr = np.stack([nx, ny, nz, np.full_like(nx, 255)], axis=-1).astype(np.uint8)
    return Image.fromarray(arr)


def make_displacement(rgb: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(rgb)
    return gray.point(lambda v: int(40 + v * 0.55))


def main() -> None:
    if not GEO_JSON.exists():
        log(f"missing {GEO_JSON}, run merge_park_geo.py first")
        sys.exit(1)

    geo = json.loads(GEO_JSON.read_text(encoding="utf-8"))
    west, south, east, north = feature_bbox(geo)
    pad_x = (east - west) * PAD_RATIO
    pad_y = (north - south) * PAD_RATIO
    west -= pad_x
    east += pad_x
    south -= pad_y
    north += pad_y
    log(f"bbox: {west:.6f},{south:.6f},{east:.6f},{north:.6f}")

    z = ZOOM
    fx0, fy0 = lonlat_to_tile(west, north, z)
    fx1, fy1 = lonlat_to_tile(east, south, z)
    x0, y0 = int(math.floor(fx0)), int(math.floor(fy0))
    x1, y1 = int(math.floor(fx1)), int(math.floor(fy1))

    mosaic = stitch_tiles(z, x0, y0, x1, y1)
    cropped = crop_to_bbox(mosaic, z, x0, y0, west, south, east, north)
    log(f"cropped: {cropped.size}")

    w, h = cropped.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        cropped = cropped.resize(
            (max(1, int(w * scale)), max(1, int(h * scale))),
            Image.Resampling.LANCZOS,
        )
        log(f"resized: {cropped.size}")

    rgba = cropped.convert("RGBA")
    rgba = ImageEnhance.Brightness(rgba).enhance(1.08)
    rgba = ImageEnhance.Contrast(rgba).enhance(1.12)
    rgba = ImageEnhance.Color(rgba).enhance(1.05)

    OUT_MAP.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(OUT_MAP, optimize=True)
    log(f"wrote {OUT_MAP} {rgba.size}")

    normal = make_normal(rgba.convert("RGB"))
    normal.save(OUT_NORMAL, optimize=True)
    log(f"wrote {OUT_NORMAL} {normal.size}")

    disp = make_displacement(rgba.convert("RGB"))
    disp.save(OUT_DISP, optimize=True)
    log(f"wrote {OUT_DISP} {disp.size}")


if __name__ == "__main__":
    main()
