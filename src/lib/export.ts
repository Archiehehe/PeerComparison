import { SP500Company, ComparisonResult, METRIC_LABELS, METRIC_KEYS } from '@/types/financial';
import { formatNumber, formatMarketCap, formatPremiumDiscount } from './calculations';

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPeerTableCSV(result: ComparisonResult) {
  const headers = ['Ticker', 'Company', 'Sector', 'Industry', 'Market Cap', ...METRIC_KEYS.map(k => METRIC_LABELS[k])];
  const rows = result.peers.map(p => [
    p.ticker,
    `"${p.name}"`,
    `"${p.sector}"`,
    `"${p.industry}"`,
    formatMarketCap(p.marketCap),
    ...METRIC_KEYS.map(k => formatNumber(p.metrics[k])),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `peer_comparison_${result.company.ticker}.csv`, 'text/csv');
}

export function exportStatsCSV(result: ComparisonResult) {
  const headers = ['Metric', 'Company', 'Peer Median', 'Premium/Discount %', 'P25', 'P75', 'N'];
  const rows = result.peerStats.map((stat, i) => {
    const cvp = result.companyVsPeers[i];
    return [
      stat.metric,
      formatNumber(cvp.companyValue),
      formatNumber(stat.median),
      formatPremiumDiscount(cvp.premiumDiscount),
      formatNumber(stat.p25),
      formatNumber(stat.p75),
      stat.n,
    ];
  });
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `peer_stats_${result.company.ticker}.csv`, 'text/csv');
}
