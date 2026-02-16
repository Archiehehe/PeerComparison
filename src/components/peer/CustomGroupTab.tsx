import { useState, useMemo, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Upload, Play } from 'lucide-react';
import { sp500Data } from '@/data/sp500';
import { computePeerStats, computeCompanyVsPeers, generateInsights, formatMarketCap, logToMcap, formatNumber } from '@/lib/calculations';
import { SP500Company, ComparisonResult } from '@/types/financial';
import { PeerStatsTable } from './PeerStatsTable';
import { CompanyVsPeersTable } from './CompanyVsPeersTable';
import { PeerDistributionChart } from './PeerDistributionChart';
import { PeerDetailsTable } from './PeerDetailsTable';
import { ValuationInsights } from './ValuationInsights';
import { exportPeerTableCSV, exportStatsCSV } from '@/lib/export';
import { Download } from 'lucide-react';

export function CustomGroupTab() {
  const [groupName, setGroupName] = useState('');
  const [tickerInput, setTickerInput] = useState('');
  const [companyTicker, setCompanyTicker] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const parseTickers = (input: string): string[] => {
    return input
      .toUpperCase()
      .split(/[\s,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean);
  };

  const handleCSVUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const tickers = text.split('\n').slice(1).map(line => line.split(',')[0].trim()).filter(Boolean);
      setTickerInput(tickers.join(', '));
    };
    reader.readAsText(file);
  };

  const run = () => {
    const tickers = parseTickers(tickerInput);
    const company = sp500Data.find(c => c.ticker === companyTicker.toUpperCase());
    if (!company || tickers.length === 0) return;

    const peers = sp500Data.filter(c => tickers.includes(c.ticker) && c.ticker !== company.ticker);
    const peerStats = computePeerStats(peers);
    const companyVsPeers = computeCompanyVsPeers(company, peerStats);
    const insights = generateInsights(company, companyVsPeers);

    setResult({
      company,
      peers,
      peerStats,
      companyVsPeers,
      insights,
      matchType: groupName || 'Custom Group',
      peerCount: peers.length,
    });
  };

  return (
    <div className="mt-6 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground">Custom Peer Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Group Name</Label>
              <Input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g., AI Chip Makers"
                className="font-mono text-sm bg-secondary border-border h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your Company Ticker</Label>
              <Input
                value={companyTicker}
                onChange={e => setCompanyTicker(e.target.value)}
                placeholder="e.g., NVDA"
                className="font-mono text-sm bg-secondary border-border h-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Peer Tickers</Label>
            <Textarea
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="Enter tickers separated by commas, spaces, or newlines (e.g., AMD, AVGO, INTC, QCOM)"
              className="font-mono text-sm bg-secondary border-border min-h-[80px]"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <label className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </label>
            </Button>
            <Button size="sm" onClick={run} className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">{result.peerCount} peers</Badge>
            <span className="text-xs text-muted-foreground">{result.matchType}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => exportStatsCSV(result)}>
                <Download className="h-3 w-3 mr-1" /> Stats CSV
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => exportPeerTableCSV(result)}>
                <Download className="h-3 w-3 mr-1" /> Peers CSV
              </Button>
            </div>
          </div>
          <PeerDistributionChart company={result.company} peers={result.peers} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PeerStatsTable stats={result.peerStats} />
            <CompanyVsPeersTable data={result.companyVsPeers} companyTicker={result.company.ticker} />
          </div>
          <ValuationInsights insights={result.insights} companyTicker={result.company.ticker} />
          <PeerDetailsTable peers={result.peers} companyTicker={result.company.ticker} />
        </div>
      )}

      {!result && (
        <div className="flex items-center justify-center h-[300px] border border-dashed border-border rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Enter your company ticker and peer tickers, then run comparison</p>
            <p className="text-xs text-muted-foreground/60">Tickers must be in the S&P 500 universe</p>
          </div>
        </div>
      )}
    </div>
  );
}
