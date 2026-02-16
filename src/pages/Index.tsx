import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, TrendingUp } from 'lucide-react';
import { sp500Data } from '@/data/sp500';
import { MatchingMode } from '@/types/financial';
import { computeComparison, logToMcap } from '@/lib/calculations';
import { exportPeerTableCSV, exportStatsCSV } from '@/lib/export';
import { useRecentTickers } from '@/hooks/useRecentTickers';
import { FilterPanel } from '@/components/peer/FilterPanel';
import { PeerStatsTable } from '@/components/peer/PeerStatsTable';
import { CompanyVsPeersTable } from '@/components/peer/CompanyVsPeersTable';
import { PeerDistributionChart } from '@/components/peer/PeerDistributionChart';
import { PeerDetailsTable } from '@/components/peer/PeerDetailsTable';
import { ValuationInsights } from '@/components/peer/ValuationInsights';
import { CustomGroupTab } from '@/components/peer/CustomGroupTab';

export default function Index() {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [matchingMode, setMatchingMode] = useState<MatchingMode>('industry-fallback');
  const [mcapRange, setMcapRange] = useState<[number, number]>([1, 4]);
  const { recentTickers, addTicker, clearRecent } = useRecentTickers();

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker);
    addTicker(ticker);
  };

  const company = useMemo(() => sp500Data.find(c => c.ticker === selectedTicker), [selectedTicker]);

  const comparison = useMemo(() => {
    if (!company) return null;
    const minMcap = logToMcap(mcapRange[0]);
    const maxMcap = logToMcap(mcapRange[1]);
    return computeComparison(company, sp500Data, matchingMode, minMcap, maxMcap);
  }, [company, matchingMode, mcapRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start gap-3">
            <div className="w-1 h-12 bg-primary rounded-full shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                Peer Comparison
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Reliable peer matching from <span className="text-accent font-medium">S&P 500</span> (Sector/Industry).
                Multiple APIs for metrics (yfinance → fallbacks to Alpha Vantage / Finnhub / FMP).
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="peers" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="peers" className="font-mono text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Peers
            </TabsTrigger>
            <TabsTrigger value="custom" className="font-mono text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Custom Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="peers">
            <div className="flex flex-col lg:flex-row gap-6">
              <FilterPanel
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
                {comparison ? (
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
                ) : (
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
          </TabsContent>

          <TabsContent value="custom">
            <CustomGroupTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-muted-foreground/50 text-center font-mono">
            Data is approximate / snapshot. Configure API keys for real-time metrics via Finnhub, Alpha Vantage, or FMP.
          </p>
        </div>
      </footer>
    </div>
  );
}
