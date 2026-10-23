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
  Calendar,
  Layers,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export interface CandlestickChartProps {
  data: MarketDataPoint[];
  symbol: string;
  height?: number;
  selectedInterval?: string;
  selectedPeriod?: string;
  onIntervalChange?: (interval: string) => void;
  onPeriodChange?: (period: string) => void;
  isLoading?: boolean;
}

// TradingView standard intervals
export const CHART_INTERVALS = [
  { label: '1m', value: '1m', desc: '1 Minute' },
  { label: '5m', value: '5m', desc: '5 Minutes' },
  { label: '15m', value: '15m', desc: '15 Minutes' },
  { label: '1h', value: '1h', desc: '1 Hour' },
  { label: '4h', value: '4h', desc: '4 Hours (Swing)' },
  { label: '1D', value: '1d', desc: '1 Day (Standard)' },
  { label: '1W', value: '1wk', desc: '1 Week (Position)' },
];

// TradingView standard timeframe ranges
export const CHART_TIMEFRAMES = [
  { label: '1D', period: '1d', defaultInterval: '5m' },
  { label: '5D', period: '5d', defaultInterval: '15m' },
  { label: '1M', period: '1mo', defaultInterval: '1h' },
  { label: '3M', period: '3mo', defaultInterval: '1d' },
  { label: '6M', period: '6mo', defaultInterval: '1d' },
  { label: '1Y', period: '1y', defaultInterval: '1d' },
];

export default function CandlestickChart({
  data,
  symbol,
  height = 380,
  selectedInterval = '1d',
  selectedPeriod = '3mo',
  onIntervalChange,
  onPeriodChange,
  isLoading = false
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Local state for interactive HUD & controls
  const [internalInterval, setInternalInterval] = useState(selectedInterval);
  const [internalPeriod, setInternalPeriod] = useState(selectedPeriod);
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

  // Sync external props with internal state
  useEffect(() => {
    if (selectedInterval) setInternalInterval(selectedInterval);
  }, [selectedInterval]);

  useEffect(() => {
    if (selectedPeriod) setInternalPeriod(selectedPeriod);
  }, [selectedPeriod]);

  // Handler for interval click
  const handleIntervalSelect = (intervalVal: string) => {
    setInternalInterval(intervalVal);
    onIntervalChange?.(intervalVal);
  };

  // Handler for timeframe range click
  const handlePeriodSelect = (periodVal: string, recommendedInterval?: string) => {
    setInternalPeriod(periodVal);
    onPeriodChange?.(periodVal);
    if (recommendedInterval && !onIntervalChange) {
      setInternalInterval(recommendedInterval);
    }
  };

  // Reset zoom & pan
  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // 1. Initialize Chart ONCE on mount or when height / expanded mode changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    const chartHeight = isExpanded ? 540 : height;

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
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
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

    // Crosshair move listener for TradingView-style HUD OHLC readout
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

      let timeStr = '';
      if (typeof param.time === 'string') {
        timeStr = param.time;
      } else if (typeof param.time === 'number') {
        const d = new Date(param.time * 1000);
        timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (typeof param.time === 'object' && param.time !== null) {
        const tObj = param.time as { year: number; month: number; day: number };
        timeStr = `${tObj.year}-${String(tObj.month).padStart(2, '0')}-${String(tObj.day).padStart(2, '0')}`;
      }

      setHoveredCandle({
        open,
        high,
        low,
        close,
        change,
        changePercent,
        time: timeStr
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
          // If datetime timestamp string exists, parse to unix timestamp for intraday support
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

      // Filter out duplicate timestamps to satisfy lightweight-charts assertion
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
    time: latestData.trade_date
  } : null);

  const isGreen = displayCandle ? displayCandle.close >= displayCandle.open : true;

  return (
    <div className="relative w-full select-none bg-[#0b0f19] rounded-xl border border-[#1e293b] p-3 space-y-2.5">
      
      {/* Top TradingView Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1e293b]">
        
        {/* Left: Symbol & Resolution / Intervals */}
        <div className="flex items-center gap-2">
          {/* Symbol & Exchange Tag */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#1e293b]">
            <span className="font-mono font-bold text-white text-sm tracking-wide">{symbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/20">
              NSE
            </span>
          </div>

          {/* Candlestick Style Icon */}
          <div className="hidden sm:flex items-center text-[#94a3b8] px-1" title="Candlestick Chart">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>

          {/* TradingView Resolution Intervals (1m, 5m, 15m, 1h, 4h, 1D, 1W) */}
          <div className="flex items-center gap-0.5 bg-[#0f172a] p-0.5 rounded-lg border border-[#1e293b]">
            {CHART_INTERVALS.map((item) => {
              const active = internalInterval.toLowerCase() === item.value.toLowerCase();
              return (
                <button
                  key={item.value}
                  type="button"
                  title={item.desc}
                  onClick={() => handleIntervalSelect(item.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
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

        {/* Right: Timeframe Range Selector & Tools */}
        <div className="flex items-center gap-2">
          {/* Timeframe Presets: 1D, 5D, 1M, 3M, 6M, 1Y */}
          <div className="flex items-center gap-0.5 bg-[#0f172a] p-0.5 rounded-lg border border-[#1e293b]">
            {CHART_TIMEFRAMES.map((tf) => {
              const active = internalPeriod.toLowerCase() === tf.period.toLowerCase();
              return (
                <button
                  key={tf.period}
                  type="button"
                  onClick={() => handlePeriodSelect(tf.period, tf.defaultInterval)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition-all ${
                    active
                      ? 'bg-[#1e293b] text-white border border-[#334155]'
                      : 'text-[#64748b] hover:text-[#cbd5e1]'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Reset Zoom / Fit Content */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan (Fit Chart)"
            className="p-1 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Full Height Mode */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Chart' : 'Expand Fullscreen Height'}
            className="p-1 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all text-xs"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* TradingView Real-Time OHLC HUD Inspection Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs px-2 py-1 bg-[#0f172a]/70 rounded-md border border-[#1e293b]/60">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          {displayCandle ? (
            <>
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
            <span className="text-[#64748b]">Hover over chart candles for real-time OHLC readout</span>
          )}
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-[10px] font-medium text-[#64748b]">
          {isLoading && (
            <span className="text-emerald-400 font-mono animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Fetching {internalInterval}...
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
          <span>Interval: <strong className="text-white font-mono">{internalInterval.toUpperCase()}</strong></span>
          <span className="mx-1">•</span>
          <span>Range: <strong className="text-white font-mono">{internalPeriod.toUpperCase()}</strong></span>
        </span>
        <span className="text-[10px] text-[#94a3b8]">
          Scroll to Zoom • Drag to Pan • Crosshair Tooltip Active
        </span>
      </div>
    </div>
  );
}
