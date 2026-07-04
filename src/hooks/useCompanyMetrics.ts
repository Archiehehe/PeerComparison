import { useState, useRef, useCallback } from 'react';
import { CompanyMetrics } from '@/types/financial';
import { fetchMetricsForTicker } from '@/lib/api';

interface CacheEntry {
  data: CompanyMetrics;
  timestamp: number;
}

const METRICS_CACHE_KEY = 'peer-comparison-metrics-cache';
const METRICS_TTL = 60 * 60 * 1000;

function loadMetricsCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(METRICS_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveMetricsCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(cache));
  } catch { }
}

export function useCompanyMetrics() {
  const [loadingTickers, setLoadingTickers] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cacheRef = useRef<Record<string, CacheEntry>>(loadMetricsCache());

  const getCachedMetrics = useCallback((ticker: string): CompanyMetrics | null => {
    const entry = cacheRef.current[ticker.toUpperCase()];
    if (entry && Date.now() - entry.timestamp < METRICS_TTL) {
      return entry.data;
    }
    return null;
  }, []);

  const fetchMetrics = useCallback(async (tickers: string[]): Promise<Record<string, CompanyMetrics>> => {
    const upper = tickers.map(t => t.toUpperCase());
    const uncached = upper.filter(t => !getCachedMetrics(t));

    if (uncached.length === 0) {
      const result: Record<string, CompanyMetrics> = {};
      for (const t of upper) {
        const cached = getCachedMetrics(t);
        if (cached) result[t] = cached;
      }
      return result;
    }

    setLoadingTickers(prev => {
      const next = new Set(prev);
      for (const t of uncached) next.add(t);
      return next;
    });

    const fetched: Record<string, CompanyMetrics> = {};
    const batchSize = 5;

    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(t => fetchMetricsForTicker(t))
      );
      for (let j = 0; j < batch.length; j++) {
        const ticker = batch[j];
        const result = results[j];
        if (result.status === 'fulfilled') {
          const metrics: CompanyMetrics = result.value;
          fetched[ticker] = metrics;
          cacheRef.current[ticker] = { data: metrics, timestamp: Date.now() };
        } else {
          setErrors(prev => ({ ...prev, [ticker]: result.reason?.message || 'Failed to fetch metrics' }));
        }
      }
    }

    saveMetricsCache(cacheRef.current);

    setLoadingTickers(prev => {
      const next = new Set(prev);
      for (const t of uncached) next.delete(t);
      return next;
    });

    for (const t of upper) {
      const cached = getCachedMetrics(t);
      if (cached && !fetched[t]) fetched[t] = cached;
    }

    return fetched;
  }, [getCachedMetrics]);

  return { fetchMetrics, loadingTickers, errors: errors as Record<string, string>, getCachedMetrics };
}
