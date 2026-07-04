import { useState, useEffect, useCallback } from 'react';
import { UniverseItem, CacheEntry } from '@/types/financial';
import { fetchSP500Constituents } from '@/lib/api';
import { sp500Data } from '@/data/sp500';

const UNIVERSE_CACHE_KEY = 'peer-comparison-universe';
const UNIVERSE_TTL = 24 * 60 * 60 * 1000;

function loadCachedUniverse(): { universe: UniverseItem[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(UNIVERSE_CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry<UniverseItem[]> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > UNIVERSE_TTL) return null;
    return { universe: entry.data, timestamp: entry.timestamp };
  } catch {
    return null;
  }
}

function saveCachedUniverse(universe: UniverseItem[]) {
  try {
    const entry: CacheEntry<UniverseItem[]> = { data: universe, timestamp: Date.now() };
    localStorage.setItem(UNIVERSE_CACHE_KEY, JSON.stringify(entry));
  } catch { }
}

function hardcodedToUniverse(): UniverseItem[] {
  return sp500Data.map(c => ({
    ticker: c.ticker,
    name: c.name,
    sector: c.sector,
    industry: c.industry,
    marketCap: c.marketCap,
  }));
}

export function useStockUniverse() {
  const [universe, setUniverse] = useState<UniverseItem[]>(() => {
    const cached = loadCachedUniverse();
    return cached ? cached.universe : hardcodedToUniverse();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const constituents = await fetchSP500Constituents(controller.signal);
      clearTimeout(timeout);
      const mapped: UniverseItem[] = constituents.map(c => ({
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        industry: c.industry,
        marketCap: null,
      }));
      setUniverse(mapped);
      setIsLive(true);
      saveCachedUniverse(mapped);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message || 'Failed to fetch S&P 500 universe');
        const fallback = hardcodedToUniverse();
        setUniverse(fallback);
        setIsLive(false);
        saveCachedUniverse(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { universe, loading, error, isLive, refresh };
}
