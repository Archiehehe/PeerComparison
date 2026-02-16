import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'peer-comparison-recent-tickers';
const MAX_ITEMS = 8;

export function useRecentTickers() {
  const [recentTickers, setRecentTickers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTickers));
    } catch { /* ignore */ }
  }, [recentTickers]);

  const addTicker = useCallback((ticker: string) => {
    setRecentTickers(prev => {
      const filtered = prev.filter(t => t !== ticker);
      return [ticker, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentTickers([]);
  }, []);

  return { recentTickers, addTicker, clearRecent };
}
