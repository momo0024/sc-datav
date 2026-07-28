"""将 public/geo/map 下的园区/补充面 shapefile 转为 GCJ02 GeoJSON。"""
from __future__ import annotations

import json
import math
from pathlib import Path

import shapefile
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
PARK_SHP = ROOT / "public/geo/map/园区/Export_Output.shp"
EXTRA_SHP = ROOT / "public/geo/map/补充面(1)/补充面/Export_Output_2.shp"
OUT_AREAS = ROOT / "src/assets/park_areas.json"
# 外轮廓沿用已有精细边界 park_outline.json，本脚本只更新分区面

# CGCS2000 3-degree GK Zone 38 (false easting 38500000) -> WGS84 lon/lat
TO_WGS84 = Transformer.from_crs(
    "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=38500000 +y_0=0 "
    "+ellps=GRS80 +units=m +no_defs",
    "EPSG:4326",
    always_xy=True,
)


def out_of_china(lng: float, lat: float) -> bool:
    return not (72.004 <= lng <= 137.8347 and 0.8293 <= lat <= 55.8271)


def _transform_lat(lng: float, lat: float) -> float:
    ret = (
        -100.0
        + 2.0 * lng
        + 3.0 * lat
        + 0.2 * lat * lat
        + 0.1 * lng * lat
        + 0.2 * math.sqrt(abs(lng))
    )
    ret += (20.0 * math.sin(6.0 * lng * math.pi) + 20.0 * math.sin(2.0 * lng * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lat * math.pi) + 40.0 * math.sin(lat / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (
        (160.0 * math.sin(lat / 12.0 * math.pi) + 320.0 * math.sin(lat * math.pi / 30.0))
        * 2.0
        / 3.0
    )
    return ret


def _transform_lng(lng: float, lat: float) -> float:
    ret = (
        300.0
        + lng
        + 2.0 * lat
        + 0.1 * lng * lng
        + 0.1 * lng * lat
        + 0.1 * math.sqrt(abs(lng))
    )
    ret += (20.0 * math.sin(6.0 * lng * math.pi) + 20.0 * math.sin(2.0 * lng * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lng * math.pi) + 40.0 * math.sin(lng / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (
        (150.0 * math.sin(lng / 12.0 * math.pi) + 300.0 * math.sin(lng / 30.0 * math.pi))
        * 2.0
        / 3.0
    )
    return ret


def wgs84_to_gcj02(lng: float, lat: float) -> tuple[float, float]:
    if out_of_china(lng, lat):
        return lng, lat
    a = 6378245.0
    ee = 0.00669342162296594323
    dlat = _transform_lat(lng - 105.0, lat - 35.0)
    dlng = _transform_lng(lng - 105.0, lat - 35.0)
    rad_lat = lat / 180.0 * math.pi
    magic = math.sin(rad_lat)
    magic = 1 - ee * magic * magic
    sqrt_magic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrt_magic) * math.pi)
    dlng = (dlng * 180.0) / (a / sqrt_magic * math.cos(rad_lat) * math.pi)
    return lng + dlng, lat + dlat


def project_xy(x: float, y: float) -> list[float]:
    lng, lat = TO_WGS84.transform(x, y)
    glng, glat = wgs84_to_gcj02(lng, lat)
    return [glng, glat]


def _perp_dist(p: list[float], a: list[float], b: list[float]) -> float:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    if dx == 0 and dy == 0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def simplify_ring(ring: list[list[float]], epsilon: float) -> list[list[float]]:
    """Douglas-Peucker；闭合环保留首尾。"""
    if len(ring) <= 4:
        return ring
    closed = ring[0] == ring[-1]
    pts = ring[:-1] if closed else ring[:]

    def _simplify(points: list[list[float]]) -> list[list[float]]:
        if len(points) <= 2:
            return points
        max_d = -1.0
        idx = 0
        for i in range(1, len(points) - 1):
            d = _perp_dist(points[i], points[0], points[-1])
            if d > max_d:
                max_d = d
                idx = i
        if max_d > epsilon:
            left = _simplify(points[: idx + 1])
            right = _simplify(points[idx:])
            return left[:-1] + right
        return [points[0], points[-1]]

    simplified = _simplify(pts)
    if len(simplified) < 3:
        # 过度简化时均匀抽稀
        step = max(1, len(pts) // 80)
        simplified = pts[::step]
        if simplified[-1] != pts[-1]:
            simplified.append(pts[-1])
    if closed:
        if simplified[0] != simplified[-1]:
            simplified.append(simplified[0][:])
    return simplified


def shape_to_polygons(shp, epsilon: float = 0.00003) -> list[list[list[list[float]]]]:
    """Convert shapefile shape (Polygon/Polyline) to MultiPolygon coordinates."""
    parts = list(shp.parts) + [len(shp.points)]
    rings: list[list[list[float]]] = []
    for i in range(len(parts) - 1):
        pts = shp.points[parts[i] : parts[i + 1]]
        ring = [project_xy(p[0], p[1]) for p in pts]
        if len(ring) < 3:
            continue
        if ring[0] != ring[-1]:
            ring.append(ring[0][:])
        ring = simplify_ring(ring, epsilon)
        if len(ring) >= 4:
            rings.append(ring)

    if not rings:
        return []

    return [[ring] for ring in rings]


def ring_centroid(ring: list[list[float]]) -> tuple[float, float]:
    # exclude duplicate closing point
    pts = ring[:-1] if len(ring) > 1 and ring[0] == ring[-1] else ring
    if not pts:
        return 0.0, 0.0
    area = 0.0
    cx = 0.0
    cy = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        cross = x0 * y1 - x1 * y0
        area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    area *= 0.5
    if abs(area) < 1e-12:
        return sum(p[0] for p in pts) / n, sum(p[1] for p in pts) / n
    cx /= 6.0 * area
    cy /= 6.0 * area
    return cx, cy


def multipoly_centroid(coords: list[list[list[list[float]]]]) -> tuple[float, float]:
    best = None
    best_area = -1.0
    for poly in coords:
        ring = poly[0]
        pts = ring[:-1] if ring and ring[0] == ring[-1] else ring
        area = 0.0
        n = len(pts)
        for i in range(n):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % n]
            area += x0 * y1 - x1 * y0
        area = abs(area) * 0.5
        if area > best_area:
            best_area = area
            best = ring_centroid(ring)
    return best or (0.0, 0.0)


def make_feature(name: str, adcode: int, coords: list, index: int) -> dict:
    cx, cy = multipoly_centroid(coords)
    return {
        "type": "Feature",
        "properties": {
            "adcode": adcode,
            "name": name,
            "center": [cx, cy],
            "centroid": [cx, cy],
            "childrenNum": 0,
            "level": "park",
            "parent": {"adcode": 0},
            "subFeatureIndex": index,
            "acroutes": [],
        },
        "geometry": {"type": "MultiPolygon", "coordinates": coords},
    }


def collect_features() -> list[dict]:
    features: list[dict] = []
    idx = 0

    sf = shapefile.Reader(str(PARK_SHP))
    field_names = [f[0] for f in sf.fields[1:]]
    for rec, shp in zip(sf.records(), sf.shapes()):
        row = dict(zip(field_names, rec))
        name = str(row.get("Layer") or "").strip()
        if not name:
            continue
        coords = shape_to_polygons(shp)
        if not coords:
            continue
        idx += 1
        features.append(make_feature(name, idx, coords, idx - 1))

    esf = shapefile.Reader(str(EXTRA_SHP))
    for shp in esf.shapes():
        coords = shape_to_polygons(shp)
        if not coords:
            continue
        idx += 1
        features.append(make_feature("综合保税区", idx, coords, idx - 1))

    return features


def bbox_of_features(features: list[dict]) -> tuple[float, float, float, float]:
    minx = miny = float("inf")
    maxx = maxy = float("-inf")
    for feat in features:
        for poly in feat["geometry"]["coordinates"]:
            for ring in poly:
                for lng, lat in ring:
                    minx = min(minx, lng)
                    maxx = max(maxx, lng)
                    miny = min(miny, lat)
                    maxy = max(maxy, lat)
    return minx, miny, maxx, maxy


def main() -> None:
    features = collect_features()
    areas = {"type": "FeatureCollection", "features": features}

    OUT_AREAS.write_text(
        json.dumps(areas, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    names = [f["properties"]["name"] for f in features]
    bbox = bbox_of_features(features)
    print("features:", len(features))
    print("names:", names)
    print("bbox(gcj02):", bbox)
    print("wrote:", OUT_AREAS)


if __name__ == "__main__":
    main()
