import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SP500Company, CompanyMetrics, METRIC_LABELS } from '@/types/financial';
import { formatNumber, formatMarketCap } from '@/lib/calculations';

const PAGE_SIZE = 15;
const DISPLAY_METRICS: (keyof CompanyMetrics)[] = ['evEbitda', 'peRatio', 'grossMargin', 'operatingMargin', 'revenueGrowth'];

type SortKey = 'marketCap' | keyof CompanyMetrics;
type SortDir = 'asc' | 'desc';

interface PeerDetailsTableProps {
  peers: SP500Company[];
  companyTicker: string;
}

export function PeerDetailsTable({ peers, companyTicker }: PeerDetailsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    return [...peers].sort((a, b) => {
      let aVal: number | null;
      let bVal: number | null;
      if (sortKey === 'marketCap') {
        aVal = a.marketCap;
        bVal = b.marketCap;
      } else {
        aVal = a.metrics[sortKey];
        bVal = b.metrics[sortKey];
      }
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [peers, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <TableHead
      className="text-xs font-mono uppercase text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => toggleSort(sortKeyVal)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyVal ? 'text-primary' : ''}`} />
      </span>
    </TableHead>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground">
          Peer Details ({peers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-mono uppercase text-muted-foreground">Ticker</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground hidden md:table-cell">Industry</TableHead>
                <SortHeader label="Mkt Cap" sortKeyVal="marketCap" />
                {DISPLAY_METRICS.map(k => (
                  <SortHeader key={k} label={METRIC_LABELS[k]} sortKeyVal={k} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => (
                <TableRow key={p.ticker} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-xs font-mono font-semibold text-primary">{p.ticker}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{p.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate hidden md:table-cell">{p.industry}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatMarketCap(p.marketCap)}</TableCell>
                  {DISPLAY_METRICS.map(k => (
                    <TableCell key={k} className="text-xs font-mono text-right">{formatNumber(p.metrics[k])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 px-2">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 px-2">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
