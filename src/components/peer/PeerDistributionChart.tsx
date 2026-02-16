import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SP500Company, CompanyMetrics, METRIC_KEYS, METRIC_LABELS } from '@/types/financial';
import { getMetricValues } from '@/lib/calculations';

const COLORS = {
  peer: '#1bb5bc',
  company: '#ff8c00',
  grid: '#1e232e',
  text: '#6e7a8a',
};

interface PeerDistributionChartProps {
  company: SP500Company;
  peers: SP500Company[];
}

export function PeerDistributionChart({ company, peers }: PeerDistributionChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof CompanyMetrics>('evEbitda');

  const chartData = useMemo(() => {
    const values = getMetricValues(peers, selectedMetric);
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return [{ range: min.toFixed(1), count: values.length, isCompany: false }];

    const binCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binWidth = (max - min) / binCount;
    const companyVal = company.metrics[selectedMetric];

    const bins = Array.from({ length: binCount }, (_, i) => {
      const lo = min + i * binWidth;
      const hi = lo + binWidth;
      const count = values.filter(v => i === binCount - 1 ? v >= lo && v <= hi : v >= lo && v < hi).length;
      const isCompany = companyVal !== null && companyVal >= lo && (i === binCount - 1 ? companyVal <= hi : companyVal < hi);
      return {
        range: lo.toFixed(1),
        count,
        isCompany,
      };
    });

    return bins;
  }, [peers, company, selectedMetric]);

  const companyVal = company.metrics[selectedMetric];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground">
            Distribution
          </CardTitle>
          <Select value={selectedMetric} onValueChange={v => setSelectedMetric(v as keyof CompanyMetrics)}>
            <SelectTrigger className="w-[160px] h-8 text-xs font-mono bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {METRIC_KEYS.map(k => (
                <SelectItem key={k} value={k} className="text-xs font-mono">{METRIC_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.peer }} />
            <span className="text-muted-foreground">Peers</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.company }} />
            <span className="text-muted-foreground">{company.ticker}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            No data available for this metric
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: COLORS.text }} axisLine={{ stroke: COLORS.grid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.text }} axisLine={{ stroke: COLORS.grid }} tickLine={false} allowDecimals={false} />
              <RechartTooltip
                contentStyle={{ background: '#151b28', border: '1px solid #1e232e', borderRadius: 4, fontSize: 11 }}
                labelStyle={{ color: COLORS.text }}
                itemStyle={{ color: '#dce0e8' }}
                formatter={(value: number, name: string) => [value, 'Count']}
                labelFormatter={(label) => `${METRIC_LABELS[selectedMetric]}: ${label}`}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCompany ? COLORS.company : COLORS.peer} fillOpacity={entry.isCompany ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
