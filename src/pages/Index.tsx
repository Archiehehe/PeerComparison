import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, Database, Loader2 } from 'lucide-react';
import { SP500Company, MatchingMode, CompanyMetrics, UniverseItem } from '@/types/financial';
import { sp500Data } from '@/data/sp500';
import { computeComparison, logToMcap } from '@/lib/calculations';
import { exportPeerTableCSV, exportStatsCSV } from '@/lib/export';
import { useRecentTickers } from '@/hooks/useRecentTickers';
import { useCompanyMetrics } from '@/hooks/useCompanyMetrics';
import { FilterPanel } from '@/components/peer/FilterPanel';
import { PeerStatsTable } from '@/components/peer/PeerStatsTable';
import { CompanyVsPeersTable } from '@/components/peer/CompanyVsPeersTable';
import { PeerDistributionChart } from '@/components/peer/PeerDistributionChart';
import { PeerDetailsTable } from '@/components/peer/PeerDetailsTable';
import { ValuationInsights } from '@/components/peer/ValuationInsights';

const universe: UniverseItem[] = sp500Data.map(c => ({
  ticker: c.ticker, name: c.name, sector: c.sector,
  industry: c.industry, marketCap: c.marketCap,
}));

function hardcodedMetricsMap(): Record<string, CompanyMetrics> {
  const map: Record<string, CompanyMetrics> = {};
  for (const c of sp500Data) map[c.ticker] = c.metrics;
  return map;
}

function buildSP500Company(
  item: UniverseItem,
  metrics: CompanyMetrics | null,
): SP500Company {
  return {
    ticker: item.ticker, name: item.name, sector: item.sector,
    industry: item.industry, marketCap: item.marketCap ?? 0,
    metrics: metrics ?? {
      peRatio: null, evEbitda: null, evSales: null, pFcf: null, pSales: null,
      grossMargin: null, operatingMargin: null, roe: null, revenueGrowth: null, debtEquity: null,
    },
  };
}

export default function Index() {
  const { fetchMetrics, loadingTickers, errors: metricErrors } = useCompanyMetrics();
  const hasMetricError = Object.keys(metricErrors).length > 0;

  const [selectedTicker, setSelectedTicker] = useState('');
  const [matchingMode, setMatchingMode] = useState<MatchingMode>('industry-fallback');
  const [mcapRange, setMcapRange] = useState<[number, number]>([1, 4]);
  const [metricsMap, setMetricsMap] = useState<Record<string, CompanyMetrics>>(hardcodedMetricsMap);
  const [fetching, setFetching] = useState(false);
  const hasLiveMetric = useRef(false);
  const { recentTickers, addTicker, clearRecent } = useRecentTickers();

  const handleSelectTicker = useCallback(async (ticker: string) => {
    setSelectedTicker(ticker);
    addTicker(ticker);
  }, [addTicker]);

  const companyItem = useMemo(
    () => universe.find(c => c.ticker === selectedTicker),
    [selectedTicker],
  );

  const peerTickers = useMemo(() => {
    if (!companyItem) return [];
    const minMcap = logToMcap(mcapRange[0]);
    const maxMcap = logToMcap(mcapRange[1]);
    let candidates = universe.filter(c => c.ticker !== companyItem.ticker);
    if (matchingMode === 'industry' || matchingMode === 'industry-fallback') {
      candidates = candidates.filter(c => c.industry === companyItem.industry);
    } else {
      candidates = candidates.filter(c => c.sector === companyItem.sector);
    }
    if (matchingMode === 'industry-fallback' && candidates.length < 5) {
      candidates = universe.filter(c => c.sector === companyItem.sector && c.ticker !== companyItem.ticker);
    }
    candidates = candidates.filter(c => {
      const mcap = c.marketCap ?? 0;
      return mcap >= minMcap && mcap <= maxMcap;
    });
    return candidates.map(c => c.ticker);
  }, [companyItem, universe, matchingMode, mcapRange]);

  useEffect(() => {
    if (!selectedTicker || peerTickers.length === 0) return;
    let cancelled = false;
    setFetching(true);
    const allTickers = [selectedTicker, ...peerTickers];
    fetchMetrics(allTickers).then(result => {
      if (!cancelled) {
        setMetricsMap(prev => ({ ...prev, ...result }));
        if (Object.keys(result).length > 0) hasLiveMetric.current = true;
        setFetching(false);
      }
    }).catch(() => {
      if (!cancelled) setFetching(false);
    });
    return () => { cancelled = true; };
  }, [selectedTicker, peerTickers, fetchMetrics]);

  const allCompanies: SP500Company[] = useMemo(
    () => universe.map(item => buildSP500Company(item, metricsMap[item.ticker] ?? null)),
    [metricsMap],
  );

  const company = useMemo(() => {
    if (!companyItem) return null;
    return buildSP500Company(companyItem, metricsMap[selectedTicker] ?? null);
  }, [companyItem, metricsMap, selectedTicker]);

  const comparison = useMemo(() => {
    if (!company || peerTickers.length === 0) return null;
    const minMcap = logToMcap(mcapRange[0]);
    const maxMcap = logToMcap(mcapRange[1]);
    return computeComparison(company, allCompanies, matchingMode, minMcap, maxMcap);
  }, [company, allCompanies, matchingMode, mcapRange, peerTickers.length]);

  const isFetching = fetching || loadingTickers.size > 0;
  const isLive = hasLiveMetric.current;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start gap-3">
            <div className="w-1 h-12 bg-primary rounded-full shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                  Peer Comparison
                </h1>
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] ${isLive ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}
                >
                  <Database className="h-3 w-3 mr-1" />
                  {isLive ? 'Live API' : 'Snapshot'}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {isLive
                  ? 'Live metrics from Yahoo Finance, Financial Modeling Prep & Alpha Vantage. Cached for 1 hour.'
                  : 'Hardcoded S&P 500 snapshot. Select a ticker to fetch live metrics.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {hasMetricError && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
            <p className="text-xs text-red-400 font-mono">
              Metrics failed for: {Object.entries(metricErrors).slice(0, 5).map(([t, e]) => `${t} (${e})`).join(', ')}
              {Object.keys(metricErrors).length > 5 && ` +${Object.keys(metricErrors).length - 5} more`}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <FilterPanel
            universe={universe}
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            matchingMode={matchingMode}
            onMatchingModeChange={setMatchingMode}
            mcapRange={mcapRange}
            onMcapRangeChange={setMcapRange}
            recentTickers={recentTickers}
            onClearRecent={clearRecent}
          />

          <div className="flex-1 space-y-6 min-w-0">
            {isFetching && company && (
              <div className="flex items-center justify-center h-[200px] border border-dashed border-border rounded-lg">
                <div className="text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">Fetching live metrics for {loadingTickers.size} tickers...</p>
                </div>
              </div>
            )}

            {comparison && !isFetching ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                    {comparison.company.ticker}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {comparison.peerCount} peers
                  </Badge>
                  <span className="text-xs text-muted-foreground">{comparison.matchType}</span>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => exportStatsCSV(comparison)}>
                      <Download className="h-3 w-3 mr-1" /> Stats
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => exportPeerTableCSV(comparison)}>
                      <Download className="h-3 w-3 mr-1" /> Peers
                    </Button>
                  </div>
                </div>

                {comparison.peerCount === 0 ? (
                  <div className="flex items-center justify-center h-[200px] border border-dashed border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">No peers matched. Try adjusting market cap range or matching mode.</p>
                  </div>
                ) : (
                  <>
                    <PeerDistributionChart company={comparison.company} peers={comparison.peers} />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <PeerStatsTable stats={comparison.peerStats} />
                      <CompanyVsPeersTable data={comparison.companyVsPeers} companyTicker={comparison.company.ticker} />
                    </div>
                    <ValuationInsights insights={comparison.insights} companyTicker={comparison.company.ticker} />
                    <PeerDetailsTable peers={comparison.peers} companyTicker={comparison.company.ticker} />
                  </>
                )}
              </>
            ) : !isFetching && !company && (
              <div className="flex items-center justify-center h-[400px] border border-dashed border-border rounded-lg">
                <div className="text-center space-y-3">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <div>
                    <p className="text-sm text-muted-foreground">Select a company to begin peer comparison</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Search for any S&P 500 ticker in the filter panel</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-muted-foreground/50 text-center font-mono">
            {isLive
              ? 'Live data from Yahoo Finance, FMP & Alpha Vantage. Hardcoded fallback values shown where API data is unavailable. Metrics cached for 1 hour.'
              : 'Data is approximate / snapshot. Select a ticker to fetch live metrics.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
