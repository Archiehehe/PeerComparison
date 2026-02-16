import { SP500Company, CompanyMetrics, PeerStat, CompanyVsPeer, MatchingMode, METRIC_KEYS, METRIC_LABELS, ComparisonResult } from '@/types/financial';

export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function median(values: number[]): number {
  return percentile(values, 50);
}

export function getMetricValues(companies: SP500Company[], key: keyof CompanyMetrics): number[] {
  return companies.map(c => c.metrics[key]).filter((v): v is number => v !== null && !isNaN(v));
}

export function computePeerStats(peers: SP500Company[]): PeerStat[] {
  return METRIC_KEYS.map(key => {
    const values = getMetricValues(peers, key);
    return {
      metric: METRIC_LABELS[key],
      key,
      p25: values.length >= 4 ? percentile(values, 25) : null,
      median: values.length >= 1 ? median(values) : null,
      p75: values.length >= 4 ? percentile(values, 75) : null,
      n: values.length,
    };
  });
}

export function computeCompanyVsPeers(company: SP500Company, peerStats: PeerStat[]): CompanyVsPeer[] {
  return peerStats.map(stat => {
    const companyValue = company.metrics[stat.key];
    const peerMedian = stat.median;
    let premiumDiscount: number | null = null;
    if (companyValue !== null && peerMedian !== null && peerMedian !== 0) {
      premiumDiscount = ((companyValue - peerMedian) / Math.abs(peerMedian)) * 100;
    }
    return {
      metric: stat.metric,
      key: stat.key,
      companyValue,
      peerMedian,
      premiumDiscount,
    };
  });
}

export function generateInsights(company: SP500Company, companyVsPeers: CompanyVsPeer[]): string[] {
  const insights: string[] = [];
  const get = (key: keyof CompanyMetrics) => companyVsPeers.find(c => c.key === key);

  const evEbitda = get('evEbitda');
  if (evEbitda?.premiumDiscount !== null && evEbitda!.premiumDiscount! >= 20) {
    insights.push(`EV/EBITDA premium of ${evEbitda!.premiumDiscount!.toFixed(0)}% observed vs. peer median — may reflect growth expectations or market positioning.`);
  } else if (evEbitda?.premiumDiscount !== null && evEbitda!.premiumDiscount! <= -20) {
    insights.push(`EV/EBITDA discount of ${Math.abs(evEbitda!.premiumDiscount!).toFixed(0)}% vs. peer median — may indicate market concern or value opportunity.`);
  }

  const opMargin = get('operatingMargin');
  if (opMargin?.premiumDiscount !== null && opMargin!.premiumDiscount! < -15) {
    insights.push(`Operating margin below peer median may justify a valuation discount relative to the peer group.`);
  } else if (opMargin?.premiumDiscount !== null && opMargin!.premiumDiscount! > 15) {
    insights.push(`Superior operating margin vs. peers could support a valuation premium.`);
  }

  const revGrowth = get('revenueGrowth');
  if (revGrowth?.premiumDiscount !== null && revGrowth!.premiumDiscount! > 50) {
    insights.push(`Revenue growth significantly exceeds peer median — high-growth premium may be warranted.`);
  } else if (revGrowth?.premiumDiscount !== null && revGrowth!.premiumDiscount! < -30) {
    insights.push(`Revenue growth trails peer median — may face headwinds or market saturation.`);
  }

  const debtEquity = get('debtEquity');
  if (debtEquity?.companyValue !== null && debtEquity?.peerMedian !== null && debtEquity!.companyValue! > debtEquity!.peerMedian! * 1.5) {
    insights.push(`Higher leverage (Debt/Equity) vs. peers may weigh on valuation through increased financial risk.`);
  }

  const roe = get('roe');
  if (roe?.premiumDiscount !== null && roe!.premiumDiscount! > 30) {
    insights.push(`ROE well above peer median suggests efficient capital deployment, supporting premium valuation.`);
  }

  const grossMargin = get('grossMargin');
  if (grossMargin?.premiumDiscount !== null && grossMargin!.premiumDiscount! > 20) {
    insights.push(`Gross margin outperformance vs. peers indicates stronger pricing power or cost structure.`);
  }

  if (insights.length === 0) {
    insights.push(`Valuation metrics broadly in line with peer group — no significant premium or discount drivers identified.`);
  }

  return insights;
}

export function matchPeers(
  company: SP500Company,
  allCompanies: SP500Company[],
  mode: MatchingMode,
  minMcap: number,
  maxMcap: number,
): { peers: SP500Company[]; matchType: string } {
  const exclude = (c: SP500Company) => c.ticker !== company.ticker && c.marketCap >= minMcap && c.marketCap <= maxMcap;

  if (mode === 'industry') {
    const peers = allCompanies.filter(c => c.industry === company.industry && exclude(c));
    return { peers, matchType: `Industry: ${company.industry}` };
  }

  if (mode === 'sector') {
    const peers = allCompanies.filter(c => c.sector === company.sector && exclude(c));
    return { peers, matchType: `Sector: ${company.sector}` };
  }

  // industry-fallback: try industry first, fall back to sector if < 5 peers
  const industryPeers = allCompanies.filter(c => c.industry === company.industry && exclude(c));
  if (industryPeers.length >= 5) {
    return { peers: industryPeers, matchType: `Industry: ${company.industry}` };
  }
  const sectorPeers = allCompanies.filter(c => c.sector === company.sector && exclude(c));
  return { peers: sectorPeers, matchType: `Sector: ${company.sector} (industry fallback — <5 industry peers)` };
}

export function computeComparison(
  company: SP500Company,
  allCompanies: SP500Company[],
  mode: MatchingMode,
  minMcap: number,
  maxMcap: number,
): ComparisonResult {
  const { peers, matchType } = matchPeers(company, allCompanies, mode, minMcap, maxMcap);
  const peerStats = computePeerStats(peers);
  const companyVsPeers = computeCompanyVsPeers(company, peerStats);
  const insights = generateInsights(company, companyVsPeers);

  return { company, peers, peerStats, companyVsPeers, insights, matchType, peerCount: peers.length };
}

// Formatting
export function formatNumber(n: number | null, decimals = 1): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toFixed(decimals);
}

export function formatMarketCap(mcap: number): string {
  if (mcap >= 1e12) return `$${(mcap / 1e12).toFixed(1)}T`;
  if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(0)}B`;
  return `$${(mcap / 1e6).toFixed(0)}M`;
}

export function formatPremiumDiscount(pd: number | null): string {
  if (pd === null) return '—';
  const sign = pd > 0 ? '+' : '';
  return `${sign}${pd.toFixed(1)}%`;
}

export function logToMcap(logVal: number): number {
  return Math.pow(10, logVal) * 1e9;
}

export function mcapToLog(mcap: number): number {
  return Math.log10(mcap / 1e9);
}
