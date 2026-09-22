'use client';

import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_STORAGE_KEY = 'marketmind_watchlist';
const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_WATCHLIST;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsLoaded(true);
    });
  }, []);

  const saveWatchlist = useCallback((newList: string[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // LocalStorage error handling
    }
  }, []);

  const toggleWatchlist = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    setWatchlist((prev) => {
      const exists = prev.includes(sym);
      const next = exists ? prev.filter((s) => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage fail
      }
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.includes(symbol.toUpperCase());
  }, [watchlist]);

  const addWatchlist = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    if (!watchlist.includes(sym)) {
      saveWatchlist([...watchlist, sym]);
    }
  }, [watchlist, saveWatchlist]);

  const removeWatchlist = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    saveWatchlist(watchlist.filter((s) => s !== sym));
  }, [watchlist, saveWatchlist]);

  return {
    watchlist,
    isLoaded,
    isInWatchlist,
    toggleWatchlist,
    addWatchlist,
    removeWatchlist,
  };
}
