'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { UserTrackedStock } from './types';

const STORAGE_KEY = 'marketmind_tracked_stocks_cache';
const DEMO_USER_ID = 'demo.analyst@marketmind.ai';

const DEFAULT_TRACKED_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'ICICIBANK', 'ITC'];

export function useTracking(userId: string = DEMO_USER_ID) {
  const [trackedStocks, setTrackedStocks] = useState<UserTrackedStock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTracked = useCallback(async () => {
    try {
      // 1. Try local cache first for instant render
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrackedStocks(parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // 2. Fetch from backend
      const data = await api.getUserTrackedStocks(userId);
      if (data && data.length > 0) {
        setTrackedStocks(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } else if (trackedStocks.length === 0) {
        // Fallback to default symbols if empty
        const initialList: UserTrackedStock[] = DEFAULT_TRACKED_SYMBOLS.map((sym) => ({
          id: `${userId}_${sym}`,
          user_id: userId,
          symbol: sym,
          company_name: sym,
          sector: 'Equities',
          is_active: true,
          priority: 1,
          custom_group: 'Default',
          report_enabled: true,
          alert_enabled: true,
          added_at: new Date().toISOString(),
        }));
        setTrackedStocks(initialList);
      }
    } catch (err) {
      console.warn('Failed to load tracked stocks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, trackedStocks.length]);

  useEffect(() => {
    loadTracked();

    const handleSync = () => {
      loadTracked();
    };

    window.addEventListener('marketmind:tracking_updated', handleSync);
    return () => {
      window.removeEventListener('marketmind:tracking_updated', handleSync);
    };
  }, [loadTracked]);

  const isTracked = useCallback(
    (symbol: string): boolean => {
      const symClean = symbol.toUpperCase().trim();
      return trackedStocks.some((s) => s.symbol.toUpperCase().trim() === symClean);
    },
    [trackedStocks]
  );

  const track = useCallback(
    async (symbol: string, companyName?: string, sector?: string): Promise<boolean> => {
      const symClean = symbol.toUpperCase().trim();
      if (isTracked(symClean)) return true;

      // Optimistic update
      const optimisticStock: UserTrackedStock = {
        id: `${userId}_${symClean}`,
        user_id: userId,
        symbol: symClean,
        company_name: companyName || symClean,
        sector: sector || 'Equities',
        is_active: true,
        priority: 1,
        custom_group: 'Default',
        report_enabled: true,
        alert_enabled: true,
        added_at: new Date().toISOString(),
      };

      const updated = [...trackedStocks, optimisticStock];
      setTrackedStocks(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('marketmind:tracking_updated'));
      }

      try {
        await api.trackStock(symClean, userId);
        return true;
      } catch (err) {
        console.error('Failed to track stock on backend:', err);
        // Revert on failure
        setTrackedStocks(trackedStocks);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedStocks));
          window.dispatchEvent(new CustomEvent('marketmind:tracking_updated'));
        }
        return false;
      }
    },
    [isTracked, trackedStocks, userId]
  );

  const untrack = useCallback(
    async (symbol: string): Promise<boolean> => {
      const symClean = symbol.toUpperCase().trim();
      if (!isTracked(symClean)) return true;

      // Optimistic remove
      const updated = trackedStocks.filter((s) => s.symbol.toUpperCase().trim() !== symClean);
      setTrackedStocks(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('marketmind:tracking_updated'));
      }

      try {
        await api.untrackStock(symClean, userId);
        return true;
      } catch (err) {
        console.error('Failed to untrack stock on backend:', err);
        // Revert on failure
        setTrackedStocks(trackedStocks);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedStocks));
          window.dispatchEvent(new CustomEvent('marketmind:tracking_updated'));
        }
        return false;
      }
    },
    [isTracked, trackedStocks, userId]
  );

  const trackedSymbols = trackedStocks.map((s) => s.symbol);

  return {
    trackedStocks,
    trackedSymbols,
    isTracked,
    track,
    untrack,
    loading,
    refresh: loadTracked,
  };
}
