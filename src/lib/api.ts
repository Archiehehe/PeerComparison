const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
const AV_BASE = 'https://www.alphavantage.co/query';

const FMP_KEY = import.meta.env.VITE_FMP_KEY;
const AV_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

if (!FMP_KEY) console.error('[PeerComparison] VITE_FMP_KEY is not set — API calls will fail');
if (!AV_KEY) console.warn('[PeerComparison] VITE_ALPHA_VANTAGE_KEY is not set — fallback will be unavailable');

interface FMPConstituent {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
}

interface FMPRatiosTTM {
  peRatioTTM: number | null;
  enterpriseValueOverEBITDATTM: number | null;
  evToSales: number | null;
  priceToFreeCashFlowsRatioTTM: number | null;
  priceSalesRatioTTM: number | null;
  grossProfitMarginTTM: number | null;
  operatingProfitMarginTTM: number | null;
  returnOnEquityTTM: number | null;
  debtEquityRatioTTM: number | null;
}

interface FMPFinancialGrowth {
  revenueGrowth: number | null;
}

interface AVOverview {
  PERatio?: string;
  EVToEBITDA?: string;
  EVToRevenue?: string;
  PriceToSalesRatioTTM?: string;
  OperatingMarginTTM?: string;
  ReturnOnEquityTTM?: string;
  RevenueGrowth?: string;
  DebtToEquityRatio?: string;
  GrossProfitTTM?: string;
  RevenueTTM?: string;
  MarketCapitalization?: string;
  Sector?: string;
  Industry?: string;
  Name?: string;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function fetchSP500Constituents(signal?: AbortSignal): Promise<{ ticker: string; name: string; sector: string; industry: string }[]> {
  const data = await fetchJson<FMPConstituent[]>(`${FMP_BASE}/sp500_constituent?apikey=${FMP_KEY}`, signal);
  return data.map(c => ({ ticker: c.symbol, name: c.name, sector: c.sector, industry: c.industry }));
}

export async function fetchRatiosTTM(ticker: string, signal?: AbortSignal): Promise<FMPRatiosTTM> {
  const data = await fetchJson<FMPRatiosTTM[]>(`${FMP_BASE}/ratios-ttm/${ticker}?apikey=${FMP_KEY}`, signal);
  return data[0] ?? {};
}

export async function fetchFinancialGrowth(ticker: string, signal?: AbortSignal): Promise<FMPFinancialGrowth> {
  const data = await fetchJson<FMPFinancialGrowth[]>(`${FMP_BASE}/financial-growth/${ticker}?apikey=${FMP_KEY}`, signal);
  return data[0] || { revenueGrowth: null };
}

export async function fetchAVOverview(ticker: string, signal?: AbortSignal): Promise<AVOverview> {
  const data = await fetchJson<AVOverview>(`${AV_BASE}?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`, signal);
  if (!data || Object.keys(data).length === 0 || (data as any).Note) {
    throw new Error((data as any)?.Note || 'Empty response from Alpha Vantage');
  }
  return data;
}

function parseNum(val: string | undefined | null): number | null {
  if (val === undefined || val === null || val === 'None' || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export async function fetchMetricsForTicker(ticker: string, signal?: AbortSignal): Promise<{
  peRatio: number | null;
  evEbitda: number | null;
  evSales: number | null;
  pFcf: number | null;
  pSales: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  roe: number | null;
  revenueGrowth: number | null;
  debtEquity: number | null;
}> {
  try {
    const [ratios, growth] = await Promise.all([
      fetchRatiosTTM(ticker, signal),
      fetchFinancialGrowth(ticker, signal),
    ]);
    return {
      peRatio: ratios.peRatioTTM,
      evEbitda: ratios.enterpriseValueOverEBITDATTM,
      evSales: ratios.evToSales,
      pFcf: ratios.priceToFreeCashFlowsRatioTTM,
      pSales: ratios.priceSalesRatioTTM,
      grossMargin: ratios.grossProfitMarginTTM != null ? ratios.grossProfitMarginTTM * 100 : null,
      operatingMargin: ratios.operatingProfitMarginTTM != null ? ratios.operatingProfitMarginTTM * 100 : null,
      roe: ratios.returnOnEquityTTM != null ? ratios.returnOnEquityTTM * 100 : null,
      revenueGrowth: growth.revenueGrowth != null ? growth.revenueGrowth * 100 : null,
      debtEquity: ratios.debtEquityRatioTTM,
    };
  } catch {
    try {
      const overview = await fetchAVOverview(ticker, signal);
      const grossProfit = parseNum(overview.GrossProfitTTM);
      const revenue = parseNum(overview.RevenueTTM);
      const grossMargin = grossProfit != null && revenue != null && revenue > 0 ? (grossProfit / revenue) * 100 : null;
      return {
        peRatio: parseNum(overview.PERatio),
        evEbitda: parseNum(overview.EVToEBITDA),
        evSales: parseNum(overview.EVToRevenue),
        pFcf: null,
        pSales: parseNum(overview.PriceToSalesRatioTTM),
        grossMargin,
        operatingMargin: parseNum(overview.OperatingMarginTTM) != null ? parseNum(overview.OperatingMarginTTM)! * 100 : null,
        roe: parseNum(overview.ReturnOnEquityTTM) != null ? parseNum(overview.ReturnOnEquityTTM)! * 100 : null,
        revenueGrowth: parseNum(overview.RevenueGrowth) != null ? parseNum(overview.RevenueGrowth)! * 100 : null,
        debtEquity: parseNum(overview.DebtToEquityRatio),
      };
    } catch {
      return {
        peRatio: null, evEbitda: null, evSales: null, pFcf: null, pSales: null,
        grossMargin: null, operatingMargin: null, roe: null, revenueGrowth: null, debtEquity: null,
      };
    }
  }
}
