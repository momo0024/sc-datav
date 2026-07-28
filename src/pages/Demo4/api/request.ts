export interface ApiResponse<T = unknown> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "/api" : "http://119.96.30.33:8096");

function withTrailingSlash(url: string) {
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);
  if (path.endsWith("/")) return url;
  return `${path}/${query}`;
}

function buildQuery(params?: Record<string, string | number | undefined | null>) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | undefined | null>
): Promise<ApiResponse<T>> {
  const path = withTrailingSlash(url.startsWith("/") ? url : `/${url}`);
  const target = `${API_BASE}${path}${buildQuery(params)}`;

  const response = await fetch(target, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Network Error: ${response.status} ${response.statusText}`);
  }

  const res = (await response.json()) as ApiResponse<T>;
  if (res?.code !== undefined && res.code !== 0) {
    console.warn(`[API] ${res.msg || res.message || "请求失败"}`);
  }
  return res;
}
