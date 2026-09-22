'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { MarketDataPoint } from '@/lib/types';

interface CandlestickChartProps {
  data: MarketDataPoint[];
  symbol: string;
  height?: number;
}

export default function CandlestickChart({ data, symbol, height = 380 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // 1. Initialize Chart ONCE on mount or when height changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear any previous canvas child
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      width: chartContainerRef.current.clientWidth || 600,
      height: height,
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        vertLine: {
          color: '#475569',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 3,
        },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',       // Emerald 500
      downColor: '#f43f5e',     // Rose 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Optimized ResizeObserver with requestAnimationFrame to prevent layout thrashing
    let animationFrameId: number;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          chartRef.current?.applyOptions({ width });
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // 2. High-speed series data update without recreating chart
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !data || data.length === 0) return;

    try {
      const formatted: CandlestickData<Time>[] = data
        .filter((d) => d.open !== null && d.close !== null && d.high !== null && d.low !== null)
        .map((d) => ({
          time: d.trade_date.split('T')[0] as Time,
          open: d.open!,
          high: d.high!,
          low: d.low!,
          close: d.close!,
        }))
        .sort((a, b) => (a.time > b.time ? 1 : -1));

      // Remove any identical duplicate dates to prevent chart assertion errors
      const uniqueData = formatted.filter((item, index, self) => index === 0 || item.time !== self[index - 1].time);
      seriesRef.current.setData(uniqueData);
      chartRef.current.timeScale().fitContent();
    } catch (err) {
      console.warn('Error updating chart series data:', err);
    }
  }, [data]);

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white tracking-wide">{symbol}</span>
          <span className="text-gray-500">Daily Candles (NSE)</span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">Real-time OHLCV</span>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
