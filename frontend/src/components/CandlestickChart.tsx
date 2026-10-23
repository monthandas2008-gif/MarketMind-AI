'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  Time,
  CrosshairMode
} from 'lightweight-charts';
import { MarketDataPoint } from '@/lib/types';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Clock, 
  BarChart2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export interface CandlestickChartProps {
  data: MarketDataPoint[];
  symbol: string;
  height?: number;
  selectedInterval?: string;
  onIntervalChange?: (interval: string) => void;
  isLoading?: boolean;
}

// Unified TradingView Timeframe & Interval Options in ONE sleek panel
export const UNIFIED_TIMEFRAMES = [
  { label: '1m', value: '1m', title: '1 Minute (Scalp)' },
  { label: '5m', value: '5m', title: '5 Minutes (Intraday)' },
  { label: '15m', value: '15m', title: '15 Minutes (Short Trend)' },
  { label: '1h', value: '1h', title: '1 Hour (Hourly Swing)' },
  { label: '4h', value: '4h', title: '4 Hours (Daily Trend)' },
  { label: '1D', value: '1d', title: '1 Day (Standard Positional)' },
  { label: '1W', value: '1wk', title: '1 Week (Macro Long-term)' },
];

export default function CandlestickChart({
  data,
  symbol,
  height = 380,
  selectedInterval = '1d',
  onIntervalChange,
  isLoading = false
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Single unified active interval state
  const [internalInterval, setInternalInterval] = useState(selectedInterval);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (selectedInterval) setInternalInterval(selectedInterval);
  }, [selectedInterval]);

  const handleIntervalSelect = (intervalVal: string) => {
    setInternalInterval(intervalVal);
    onIntervalChange?.(intervalVal);
  };

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // Format timestamp helper with IST AM/PM
  const formatISTDateTime = (rawTime: string | number | { year: number; month: number; day: number }) => {
    try {
      if (typeof rawTime === 'number') {
        const d = new Date(rawTime * 1000);
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata'
        }) + ' ' + d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        });
      }
      if (typeof rawTime === 'string') {
        if (rawTime.includes('T') || rawTime.includes(':')) {
          const d = new Date(rawTime);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'Asia/Kolkata'
            }) + ' ' + d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            });
          }
        }
        return rawTime;
      }
      if (typeof rawTime === 'object' && rawTime !== null) {
        return `${String(rawTime.day).padStart(2, '0')}/${String(rawTime.month).padStart(2, '0')}/${rawTime.year}`;
      }
    } catch {
      // Fallback
    }
    return String(rawTime);
  };

  // 1. Initialize Chart ONCE on mount or when container height changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    const chartHeight = isExpanded ? 520 : height;

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
      height: chartHeight,
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 3,
        // Format time on X-axis with AM / PM for intraday
        tickMarkFormatter: (time: Time) => {
          if (typeof time === 'number') {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            });
          }
          return String(time);
        },
      },
      localization: {
        timeFormatter: (time: Time) => formatISTDateTime(time),
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.08,
          bottom: 0.12,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',       // Emerald 500
      downColor: '#f43f5e',     // Rose 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    // Crosshair move listener for real-time OHLC inspection with AM / PM formatting
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredCandle(null);
        return;
      }

      const bar = param.seriesData.get(candlestickSeries) as CandlestickData<Time> | undefined;
      if (!bar) {
        setHoveredCandle(null);
        return;
      }

      const open = bar.open;
      const high = bar.high;
      const low = bar.low;
      const close = bar.close;
      const change = close - open;
      const changePercent = open ? (change / open) * 100 : 0;
      const formattedTime = formatISTDateTime(param.time as any);

      setHoveredCandle({
        open,
        high,
        low,
        close,
        change,
        changePercent,
        time: formattedTime
      });
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Responsive resize observer
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
  }, [height, isExpanded]);

  // 2. High-speed series data update without recreating the chart instance
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !data || data.length === 0) return;

    try {
      const formatted: CandlestickData<Time>[] = data
        .filter((d) => d.open !== null && d.close !== null && d.high !== null && d.low !== null)
        .map((d) => {
          const rawDate = d.trade_date;
          let timeVal: Time;
          if (rawDate.includes('T') || rawDate.includes(':') || rawDate.includes(' ')) {
            const unixTime = Math.floor(new Date(rawDate).getTime() / 1000);
            timeVal = (isNaN(unixTime) ? rawDate.split('T')[0] : unixTime) as Time;
          } else {
            timeVal = rawDate.split('T')[0] as Time;
          }

          return {
            time: timeVal,
            open: d.open!,
            high: d.high!,
            low: d.low!,
            close: d.close!,
          };
        })
        .sort((a, b) => {
          const aT = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
          const bT = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
          return aT - bT;
        });

      // Filter duplicate timestamps to satisfy lightweight-charts assertion
      const uniqueData: CandlestickData<Time>[] = [];
      const seenTimes = new Set<string | number>();

      for (const item of formatted) {
        const k = item.time as string | number;
        if (!seenTimes.has(k)) {
          seenTimes.add(k);
          uniqueData.push(item);
        }
      }

      seriesRef.current.setData(uniqueData);
      chartRef.current.timeScale().fitContent();
    } catch (err) {
      console.warn('Error updating chart series data:', err);
    }
  }, [data]);

  // Latest candle for fallback HUD display
  const latestData = data && data.length > 0 ? data[data.length - 1] : null;
  const displayCandle = hoveredCandle || (latestData ? {
    open: latestData.open ?? 0,
    high: latestData.high ?? 0,
    low: latestData.low ?? 0,
    close: latestData.close ?? 0,
    change: (latestData.close ?? 0) - (latestData.open ?? 0),
    changePercent: latestData.change_percent ?? 0,
    time: formatISTDateTime(latestData.trade_date)
  } : null);

  const isGreen = displayCandle ? displayCandle.close >= displayCandle.open : true;

  return (
    <div className="relative w-full select-none bg-[#0b0f19] rounded-xl border border-[#1e293b] p-3 space-y-2.5">
      
      {/* Top TradingView Control Toolbar: SINGLE UNIFIED ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1e293b]">
        
        {/* Left: Symbol & Exchange Tag + Candlestick Icon */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-[#1e293b]">
            <span className="font-mono font-bold text-white text-sm tracking-wide">{symbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/20">
              NSE
            </span>
          </div>

          <div className="flex items-center text-[#94a3b8]" title="Candlestick Chart">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>

          {/* SINGLE UNIFIED PANEL FOR TIMEFRAMES / INTERVALS */}
          <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#1e293b]">
            {UNIFIED_TIMEFRAMES.map((item) => {
              const active = internalInterval.toLowerCase() === item.value.toLowerCase();
              return (
                <button
                  key={item.value}
                  type="button"
                  title={item.title}
                  onClick={() => handleIntervalSelect(item.value)}
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Chart Tools (Reset Zoom, Expand Fullscreen) */}
        <div className="flex items-center gap-1.5">
          {/* Reset Zoom / Fit Content */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan (Fit Chart)"
            className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] hidden sm:inline">Fit Chart</span>
          </button>

          {/* Toggle Full Height Mode */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Chart' : 'Expand Fullscreen Height'}
            className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all text-xs"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* TradingView Real-Time OHLC HUD Inspection Strip with AM/PM Time */}
      <div className="flex flex-wrap items-center justify-between text-xs px-2.5 py-1.5 bg-[#0f172a]/70 rounded-md border border-[#1e293b]/60">
        <div className="flex flex-wrap items-center gap-3.5 font-mono text-[11px]">
          {displayCandle ? (
            <>
              {/* Exact Timestamp with AM / PM */}
              <div className="flex items-center gap-1 pr-2 border-r border-[#1e293b] text-[#cbd5e1]">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-medium">{displayCandle.time}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[#64748b]">O:</span>
                <span className="font-semibold text-white">₹{displayCandle.open.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#64748b]">H:</span>
                <span className="font-semibold text-emerald-400">₹{displayCandle.high.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#64748b]">L:</span>
                <span className="font-semibold text-rose-400">₹{displayCandle.low.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#64748b]">C:</span>
                <span className={`font-semibold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{displayCandle.close.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#64748b]">Chg:</span>
                <span className={`font-semibold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {displayCandle.change >= 0 ? '+' : ''}{displayCandle.change.toFixed(2)} ({displayCandle.changePercent.toFixed(2)}%)
                </span>
              </div>
            </>
          ) : (
            <span className="text-[#64748b]">Hover over candlesticks for live OHLC + AM/PM timestamp</span>
          )}
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-[10px] font-medium text-[#64748b]">
          {isLoading && (
            <span className="text-emerald-400 font-mono animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Syncing {internalInterval}...
            </span>
          )}
          <span className="hidden sm:inline">TradingView Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#0b0f19]/60 backdrop-blur-xs flex items-center justify-center">
            <div className="flex items-center gap-2 bg-[#111827] px-3.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Syncing {symbol} {internalInterval} Candlesticks...
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Bottom Chart Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 px-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#94a3b8]" />
          <span>Active Interval: <strong className="text-white font-mono">{internalInterval.toUpperCase()}</strong></span>
          <span className="mx-1">•</span>
          <span>Live Synchronized with NSE Market</span>
        </span>
        <span className="text-[10px] text-[#94a3b8]">
          Scroll to Zoom • Drag to Pan • Crosshair Tooltip with AM/PM IST
        </span>
      </div>
    </div>
  );
}
