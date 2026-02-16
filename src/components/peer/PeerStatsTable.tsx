import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { PeerStat } from '@/types/financial';
import { formatNumber } from '@/lib/calculations';

interface PeerStatsTableProps {
  stats: PeerStat[];
}

export function PeerStatsTable({ stats }: PeerStatsTableProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          Peer Distribution Stats
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p className="text-xs">P25/P75 represent the 25th and 75th percentiles of the peer group distribution.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-mono uppercase text-muted-foreground">Metric</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">P25</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">Median</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">P75</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">N</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map(stat => (
                <TableRow key={stat.key} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-xs font-medium">{stat.metric}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">{formatNumber(stat.p25)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-accent font-semibold">{formatNumber(stat.median)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">{formatNumber(stat.p75)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">{stat.n}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
