import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface ValuationInsightsProps {
  insights: string[];
  companyTicker: string;
}

export function ValuationInsights({ insights, companyTicker }: ValuationInsightsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Why might <span className="text-primary">{companyTicker}</span> valuation differ vs peers?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span className="text-foreground/80">{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
