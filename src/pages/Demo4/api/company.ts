import { apiGet } from "./request";

export interface CompanyRecord {
  id?: string;
  company_name: string;
  company_longitude: number;
  company_latitude: number;
  company_credit_code: string;
  company_traded: number;
  tag_name?: string;
  import_project?: number;
  chain_name?: string;
  product_type?: string;
  company_industry?: string;
  company_score?: number;
  authorized_patents_count?: number;
  authorized_invention_patents_count?: number;
  val_park?: string;
}

export interface CompanyListData {
  total: number;
  page: number;
  page_size: number;
  list: CompanyRecord[];
}

export interface CompanyStatItem {
  num?: number;
  count?: number;
  name?: string;
  industry_name?: string;
  chain_name?: string;
  product_type?: string;
  park_name?: string;
}

export interface CompanyTypeInfoItem {
  type_id: number;
  park_name: string;
  num: number;
}

export interface ParkItem {
  park_id: number;
  park_name: string;
  num?: number;
}

export interface AboveScaleItem {
  remark: string;
  sum: number;
}

export interface StatRow {
  name: string;
  count: number;
}

function statItemName(item: CompanyStatItem) {
  return (
    String(
      item.industry_name ||
        item.name ||
        item.chain_name ||
        item.product_type ||
        item.park_name ||
        "未分类"
    ).trim() || "未分类"
  );
}

function statItemCount(item: CompanyStatItem) {
  const n = Number(item.count ?? item.num);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeCompanyStatList(list: CompanyStatItem[] | undefined | null): StatRow[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({ name: statItemName(item), count: statItemCount(item) }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function normalizeTypeInfoList(
  list: CompanyTypeInfoItem[] | undefined | null
): StatRow[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      name: String(item.park_name || "未分类").trim() || "未分类",
      count: Number(item.num) || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function normalizeCompany(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    id:
      company.id ||
      company.company_credit_code ||
      `${company.company_name}-${company.company_longitude}`,
    company_score: Number(company.company_score) || 70,
    tag_name:
      company.tag_name ||
      (company.import_project === 1 ? "招商引资" : "本土培育"),
  };
}

export function patentCount(company: CompanyRecord) {
  return (
    Number(company.authorized_patents_count || 0) +
    Number(company.authorized_invention_patents_count || 0)
  );
}

export function scoreOf(company: CompanyRecord) {
  return Number(company.company_score) || 60 + (patentCount(company) % 25);
}

export async function fetchParkChain(parkId?: number) {
  return apiGet<CompanyStatItem[]>("/company/ParkChain", {
    park_id: parkId != null && parkId > 0 ? parkId : undefined,
  });
}

export async function fetchCompanyTypeInfo(parkId?: number) {
  return apiGet<CompanyTypeInfoItem[]>("/company/typeInfo", {
    park_id: parkId != null && parkId > 0 ? parkId : undefined,
  });
}

export async function fetchParkList() {
  return apiGet<ParkItem[]>("/company/park");
}

export async function fetchAboveScale() {
  return apiGet<AboveScaleItem[]>("/company/aboveScale");
}

export async function fetchCompanies(page = 1, pageSize = 1000) {
  return apiGet<CompanyListData>("/company", {
    page,
    page_size: pageSize,
  });
}
