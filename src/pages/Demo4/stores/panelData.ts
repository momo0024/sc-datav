import { create } from "zustand";
import {
  fetchAboveScale,
  fetchCompanies,
  fetchCompanyTypeInfo,
  fetchParkChain,
  fetchParkList,
  normalizeCompany,
  normalizeCompanyStatList,
  normalizeTypeInfoList,
  patentCount,
  scoreOf,
  type AboveScaleItem,
  type CompanyRecord,
  type ParkItem,
  type StatRow,
} from "../api/company";

export interface ParkRankRow {
  name: string;
  count: number;
}

interface PanelDataStore {
  loading: boolean;
  loaded: boolean;
  companies: CompanyRecord[];
  parks: ParkItem[];
  parkChain: StatRow[];
  typeInfo: StatRow[];
  aboveScale: AboveScaleItem[];
  load: () => Promise<void>;
}

export const usePanelDataStore = create<PanelDataStore>((set, get) => ({
  loading: false,
  loaded: false,
  companies: [],
  parks: [],
  parkChain: [],
  typeInfo: [],
  aboveScale: [],
  load: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const [companySettled, parkSettled, chainSettled, typeSettled, aboveSettled] =
        await Promise.allSettled([
          fetchCompanies(1, 1000),
          fetchParkList(),
          fetchParkChain(),
          fetchCompanyTypeInfo(),
          fetchAboveScale(),
        ]);

      const companyRes =
        companySettled.status === "fulfilled" ? companySettled.value : null;
      const parkRes =
        parkSettled.status === "fulfilled" ? parkSettled.value : null;
      const chainRes =
        chainSettled.status === "fulfilled" ? chainSettled.value : null;
      const typeRes =
        typeSettled.status === "fulfilled" ? typeSettled.value : null;
      const aboveRes =
        aboveSettled.status === "fulfilled" ? aboveSettled.value : null;

      const list =
        companyRes?.code === 0 && Array.isArray(companyRes.data?.list)
          ? companyRes.data.list.map(normalizeCompany)
          : [];

      set({
        companies: list,
        parks:
          parkRes?.code === 0 && Array.isArray(parkRes.data) ? parkRes.data : [],
        parkChain:
          chainRes?.code === 0 ? normalizeCompanyStatList(chainRes.data) : [],
        typeInfo:
          typeRes?.code === 0 ? normalizeTypeInfoList(typeRes.data) : [],
        aboveScale:
          aboveRes?.code === 0 && Array.isArray(aboveRes.data)
            ? aboveRes.data
            : [],
        loaded: true,
      });
    } catch (error) {
      console.warn("[Demo4] panel data load failed", error);
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));

export function selectCompanyMetrics(companies: CompanyRecord[]) {
  const total = companies.length;
  const listed = companies.filter((item) => item.company_traded === 1).length;
  const native = companies.filter((item) =>
    String(item.tag_name || "").includes("本土")
  ).length;
  const attract = companies.filter((item) =>
    String(item.tag_name || "").includes("招商")
  ).length;
  const patents = companies.reduce((sum, item) => sum + patentCount(item), 0);
  const avgScore =
    total > 0
      ? Math.round(
          (companies.reduce((sum, item) => sum + scoreOf(item), 0) / total) * 10
        ) / 10
      : 0;

  return { total, listed, native, attract, patents, avgScore };
}

export function selectTopParks(parks: ParkItem[], limit = 50): ParkRankRow[] {
  return [...parks]
    .map((item) => ({
      name: String(item.park_name || "未命名园区").trim() || "未命名园区",
      count: Number(item.num) || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function ratioPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}
