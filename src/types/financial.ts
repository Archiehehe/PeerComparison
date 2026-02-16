export type MatchingMode = 'industry-fallback' | 'industry' | 'sector';

export interface CompanyMetrics {
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
}

export interface SP500Company {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  metrics: CompanyMetrics;
}

export interface PeerStat {
  metric: string;
  key: keyof CompanyMetrics;
  p25: number | null;
  median: number | null;
  p75: number | null;
  n: number;
}

export interface CompanyVsPeer {
  metric: string;
  key: keyof CompanyMetrics;
  companyValue: number | null;
  peerMedian: number | null;
  premiumDiscount: number | null;
}

export interface ComparisonResult {
  company: SP500Company;
  peers: SP500Company[];
  peerStats: PeerStat[];
  companyVsPeers: CompanyVsPeer[];
  insights: string[];
  matchType: string;
  peerCount: number;
}

export const METRIC_LABELS: Record<keyof CompanyMetrics, string> = {
  evEbitda: 'EV/EBITDA',
  evSales: 'EV/Sales',
  peRatio: 'P/E',
  pFcf: 'P/FCF',
  pSales: 'P/Sales',
  grossMargin: 'Gross Margin %',
  operatingMargin: 'Op. Margin %',
  roe: 'ROE %',
  revenueGrowth: 'Rev. Growth %',
  debtEquity: 'Debt/Equity',
};

export const METRIC_KEYS: (keyof CompanyMetrics)[] = [
  'evEbitda', 'evSales', 'peRatio', 'pFcf', 'pSales',
  'grossMargin', 'operatingMargin', 'roe', 'revenueGrowth', 'debtEquity',
];

export const VALUATION_METRICS: (keyof CompanyMetrics)[] = [
  'evEbitda', 'evSales', 'peRatio', 'pFcf', 'pSales',
];

export const FUNDAMENTAL_METRICS: (keyof CompanyMetrics)[] = [
  'grossMargin', 'operatingMargin', 'roe', 'revenueGrowth', 'debtEquity',
];
