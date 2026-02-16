import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, RotateCcw, ChevronsUpDown, Clock, X } from 'lucide-react';
import { sp500Data } from '@/data/sp500';
import { MatchingMode } from '@/types/financial';
import { formatMarketCap, logToMcap } from '@/lib/calculations';

interface FilterPanelProps {
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  matchingMode: MatchingMode;
  onMatchingModeChange: (mode: MatchingMode) => void;
  mcapRange: [number, number];
  onMcapRangeChange: (range: [number, number]) => void;
  recentTickers: string[];
  onClearRecent: () => void;
}

export function FilterPanel({
  selectedTicker,
  onSelectTicker,
  matchingMode,
  onMatchingModeChange,
  mcapRange,
  onMcapRangeChange,
  recentTickers,
  onClearRecent,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const selectedCompany = useMemo(
    () => sp500Data.find(c => c.ticker === selectedTicker),
    [selectedTicker]
  );

  const resetMcap = () => onMcapRangeChange([1, 4]);

  return (
    <Card className="lg:w-[320px] w-full shrink-0 bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-mono tracking-wider uppercase text-muted-foreground">
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Ticker Search */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-mono text-sm h-10 bg-secondary border-border"
              >
                {selectedCompany ? (
                  <span>
                    <span className="text-primary">{selectedCompany.ticker}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{selectedCompany.name}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Search ticker...</span>
                )}
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-popover border-border" align="start">
              <Command className="bg-transparent">
                <CommandInput placeholder="Ticker or company name..." className="font-mono text-sm" />
                <CommandList>
                  <CommandEmpty className="text-muted-foreground text-xs py-4 text-center">
                    No company found in S&P 500 universe.
                  </CommandEmpty>
                  <CommandGroup>
                    {sp500Data.map(c => (
                      <CommandItem
                        key={c.ticker}
                        value={`${c.ticker} ${c.name}`}
                        onSelect={() => {
                          onSelectTicker(c.ticker);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="font-mono text-primary text-xs w-14 inline-block">{c.ticker}</span>
                        <span className="text-xs text-foreground truncate">{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Matching Mode */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Peer Matching</Label>
          <RadioGroup
            value={matchingMode}
            onValueChange={(v) => onMatchingModeChange(v as MatchingMode)}
            className="space-y-1.5"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="industry-fallback" id="mode-fallback" />
              <Label htmlFor="mode-fallback" className="text-xs cursor-pointer">Industry (fallback to sector)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="industry" id="mode-industry" />
              <Label htmlFor="mode-industry" className="text-xs cursor-pointer">Industry only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sector" id="mode-sector" />
              <Label htmlFor="mode-sector" className="text-xs cursor-pointer">Sector only</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Market Cap Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Market Cap Range</Label>
            <Button variant="ghost" size="sm" onClick={resetMcap} className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Min</span>
                <span className="font-mono text-foreground">{formatMarketCap(logToMcap(mcapRange[0]))}</span>
              </div>
              <Slider
                value={[mcapRange[0]]}
                min={1}
                max={4}
                step={0.05}
                onValueChange={v => onMcapRangeChange([v[0], mcapRange[1]])}
                className="cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Max</span>
                <span className="font-mono text-foreground">{formatMarketCap(logToMcap(mcapRange[1]))}</span>
              </div>
              <Slider
                value={[mcapRange[1]]}
                min={1}
                max={4}
                step={0.05}
                onValueChange={v => onMcapRangeChange([mcapRange[0], v[0]])}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Recent Tickers */}
        {recentTickers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Recent
              </Label>
              <Button variant="ghost" size="sm" onClick={onClearRecent} className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {recentTickers.map(t => (
                <Badge
                  key={t}
                  variant="outline"
                  className="cursor-pointer font-mono text-xs hover:bg-secondary transition-colors"
                  onClick={() => onSelectTicker(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
