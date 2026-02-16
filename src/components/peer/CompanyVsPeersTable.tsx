import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CompanyVsPeer } from '@/types/financial';
import { formatNumber, formatPremiumDiscount } from '@/lib/calculations';

interface CompanyVsPeersTableProps {
  data: CompanyVsPeer[];
  companyTicker: string;
}

export function CompanyVsPeersTable({ data, companyTicker }: CompanyVsPeersTableProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground">
          <span className="text-primary">{companyTicker}</span> vs Peers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-mono uppercase text-muted-foreground">Metric</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">Company</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">Peer Med.</TableHead>
                <TableHead className="text-xs font-mono uppercase text-muted-foreground text-right">Prem./Disc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.key} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-xs font-medium">{row.metric}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-primary">{formatNumber(row.companyValue)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-accent">{formatNumber(row.peerMedian)}</TableCell>
                  <TableCell className={`text-xs font-mono text-right font-semibold ${
                    row.premiumDiscount === null ? 'text-muted-foreground' :
                    row.premiumDiscount > 0 ? 'text-positive' : 'text-negative'
                  }`}>
                    {formatPremiumDiscount(row.premiumDiscount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
