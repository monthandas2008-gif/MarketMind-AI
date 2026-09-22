'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, ShieldCheck, Activity, Cpu,
  Lock, Mail, User, Sparkles, CheckCircle2, ChevronRight,
  AlertCircle, Eye, EyeOff, Search, TrendingUp, TrendingDown,
  BarChart2, FileText, Compass, Layers, Check, Clock
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatINR, formatPercent, getDeltaMeta } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface StockPreviewData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  rsi: number;
  macdSignal: string;
  volumeRatio: number;
  agentVerdict: string;
  verdictType: 'bullish' | 'bearish' | 'neutral';
}

const POPULAR_STOCKS: Record<string, StockPreviewData> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    price: 2942.50,
    change: 1.25,
    rsi: 58.4,
    macdSignal: 'Bullish Crossover',
    volumeRatio: 1.28,
    agentVerdict: 'Strong consolidation above 20-DMA with positive energy refining margins.',
    verdictType: 'bullish'
  },
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    price: 3894.20,
    change: 2.15,
    rsi: 63.8,
    macdSignal: 'Accelerating Momentum',
    volumeRatio: 1.45,
    agentVerdict: 'Institutional accumulation following tier-1 BFSI deal renewals.',
    verdictType: 'bullish'
  },
  INFY: {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1618.40,
    change: 1.60,
    rsi: 59.2,
    macdSignal: 'Positive Divergence',
    volumeRatio: 1.15,
    agentVerdict: 'Cloud migration contracts supporting revenue visibility into FY26.',
    verdictType: 'bullish'
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 1482.10,
    change: -0.85,
    rsi: 46.1,
    macdSignal: 'Range Neutral',
    volumeRatio: 0.92,
    agentVerdict: 'Credit-to-deposit normalization continuing; key support at ₹1,460.',
    verdictType: 'neutral'
  },
  TATAMOTORS: {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    price: 986.30,
    change: 1.95,
    rsi: 61.5,
    macdSignal: 'Bullish Expansion',
    volumeRatio: 1.34,
    agentVerdict: 'JLR order book expansion and EV segment market share gains.',
    verdictType: 'bullish'
  },
  ICICIBANK: {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    price: 1088.60,
    change: -0.45,
    rsi: 51.3,
    macdSignal: 'Consolidation',
    volumeRatio: 0.88,
    agentVerdict: 'Stable asset quality with net interest margins holding steady.',
    verdictType: 'neutral'
  }
};

export default function LandingPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Interactive Stock Preview State
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');
  const [stockQuery, setStockQuery] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setPendingNotice('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (!email.includes('@')) {
        setAuthError('Please provide a valid email address.');
        setAuthLoading(false);
        return;
      }
      if (password.length < 6) {
        setAuthError('Security rule: Password must be at least 6 characters.');
        setAuthLoading(false);
        return;
      }

      if (authMode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          setAuthSuccess('Authentication verified. Launching terminal...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 600);
        } else if (result.status === 'pending') {
          setPendingNotice(
            result.message ||
            'Your account is pending administrator approval by monthandas2008@gmail.com. Access will be unlocked once approved.'
          );
        } else {
          setAuthError(result.message || 'Invalid credentials or access rejected.');
        }
      } else {
        if (!name.trim()) {
          setAuthError('Please provide your full name or organization.');
          setAuthLoading(false);
          return;
        }

        const result = await register(email, password, name);
        if (result.success && result.status === 'approved') {
          setAuthSuccess('Administrator account verified. Launching terminal...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 600);
        } else if (result.status === 'pending') {
          setPendingNotice(
            result.message ||
            'Registration submitted successfully! Your account is pending administrator approval by monthandas2008@gmail.com. You will be able to log in once approved.'
          );
          setAuthMode('login');
        } else {
          setAuthError(result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const heroIndices = [
    { symbol: 'NIFTY 50', price: 23346.40, change: 0.33, isVix: false },
    { symbol: 'SENSEX', price: 76820.10, change: 0.28, isVix: false },
    { symbol: 'BANK NIFTY', price: 49850.20, change: -0.12, isVix: false },
    { symbol: 'INDIA VIX', price: 13.42, change: -2.40, isVix: true },
  ];

  const currentPreview = POPULAR_STOCKS[selectedStock] || POPULAR_STOCKS['RELIANCE'];
  const previewDelta = getDeltaMeta(currentPreview.change);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-16">
        
        {/* HERO SECTION WITH EMBEDDED AUTH TERMINAL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Left Column: Hero Text & Value Proposition (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111827] border border-[#1e293b] text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Desk Indian Financial Intelligence • NSE / BSE</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                Institutional Market Intelligence for{' '}
                <span className="text-emerald-400">Indian Equities</span>
              </h1>
              <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed max-w-2xl font-normal">
                Deterministic technical math, live multi-publisher news extraction, and volume anomaly detection integrated into an institutional multi-agent research terminal.
              </p>
            </div>

            {/* Live Benchmark Indices Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {heroIndices.map((idx) => {
                const delta = getDeltaMeta(idx.change);
                return (
                  <div
                    key={idx.symbol}
                    className="bg-[#111827] p-3 rounded-lg border border-[#1e293b] hover:border-[#334155] transition-colors"
                  >
                    <span className="text-[11px] text-[#94a3b8] font-medium block uppercase tracking-wider">
                      {idx.symbol}
                    </span>
                    <span className="text-base font-bold text-white num-tabular block mt-1">
                      {idx.isVix ? idx.price.toFixed(2) : formatINR(idx.price, { showDecimals: true })}
                    </span>
                    <span className={`text-xs font-semibold num-tabular block mt-0.5 ${delta.colorClass}`}>
                      {delta.glyph} {formatPercent(idx.change)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="default" size="lg" className="font-semibold text-xs gap-2 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19]">
                  <span>Explore Terminal Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/stocks">
                <Button variant="outline" size="lg" className="font-medium text-xs border-[#1e293b] bg-[#111827] text-[#cbd5e1] hover:text-white hover:border-[#334155]">
                  NSE Equity Screener
                </Button>
              </Link>
              <Link href="/ask">
                <Button variant="outline" size="lg" className="font-medium text-xs border-[#1e293b] bg-[#111827] text-[#cbd5e1] hover:text-white hover:border-[#334155]">
                  Ask MarketMind
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#94a3b8]">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Math (NumPy & Pandas)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Grounded News Citations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero Hallucinations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Institutional Sign-In Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#111827] rounded-xl p-6 sm:p-7 border border-[#1e293b] shadow-xl space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    M
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      {authMode === 'login' ? 'Institutional Access' : 'Analyst Registration'}
                    </h2>
                    <p className="text-xs text-[#94a3b8]">
                      MarketMind Research Terminal
                    </p>
                  </div>
                </div>
                <Badge variant="bullish">Live Session</Badge>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-[#1e293b] text-xs">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-1.5 rounded-md transition-all font-semibold ${
                    authMode === 'login'
                      ? 'bg-[#111827] text-white border border-[#1e293b] shadow-sm'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-1.5 rounded-md transition-all font-semibold ${
                    authMode === 'register'
                      ? 'bg-[#111827] text-white border border-[#1e293b] shadow-sm'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs" suppressHydrationWarning>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[#94a3b8] font-medium mb-1">Full Name / Organization</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Manthan Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[#94a3b8] font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                    <Input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#94a3b8] font-medium">Password</label>
                    {authMode === 'login' && (
                      <span className="text-[11px] text-[#64748b] hover:text-emerald-400 cursor-pointer">
                        Forgot?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pendingNotice && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-semibold block mb-0.5">Approval Required</span>
                      <span>{pendingNotice}</span>
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={authLoading}
                  className="w-full text-xs font-semibold gap-2 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] h-10 mt-2"
                >
                  <span>
                    {authLoading
                      ? 'Authenticating...'
                      : authMode === 'login'
                      ? 'Enter Research Terminal'
                      : 'Create Analyst Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Session Encryption
                </span>
                <Link href="/dashboard" className="text-emerald-400 hover:underline">
                  Skip as Guest →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE LIVE EQUITY LOOKUP PREVIEW */}
        <section className="bg-[#111827] rounded-xl p-6 sm:p-8 border border-[#1e293b] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-1">
                <Search className="w-3.5 h-3.5" />
                <span>Interactive Stock Intelligence Sandbox</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Inspect Any Monitored Indian Stock
              </h2>
            </div>
            <p className="text-xs text-[#94a3b8] max-w-sm">
              Click any flagship equity below to test real-time technical momentum, volume divergence, and agent synthesis.
            </p>
          </div>

          {/* Quick Select Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#64748b] font-medium mr-1">Quick Select:</span>
            {Object.keys(POPULAR_STOCKS).map((sym) => {
              const item = POPULAR_STOCKS[sym];
              const isSelected = selectedStock === sym;
              const delta = getDeltaMeta(item.change);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSelectedStock(sym)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#162032] border-emerald-500/50 text-white shadow-sm'
                      : 'bg-[#0b0f19] border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#334155]'
                  }`}
                >
                  <span>{sym}</span>
                  <span className={`num-tabular font-medium text-[11px] ${delta.colorClass}`}>
                    {delta.glyph} {formatPercent(item.change)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Stock Snapshot Left (5 cols) */}
            <div className="lg:col-span-5 bg-[#0b0f19] rounded-lg p-5 border border-[#1e293b] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-emerald-400 font-semibold tracking-wider">NSE / BSE</span>
                    <h3 className="text-2xl font-bold text-white mt-0.5">{currentPreview.symbol}</h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{currentPreview.name}</p>
                  </div>
                  <Badge variant={currentPreview.verdictType}>{currentPreview.verdictType}</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-[#1e293b] flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-white num-tabular">
                    {formatINR(currentPreview.price)}
                  </span>
                  <span className={`text-sm font-semibold num-tabular ${previewDelta.colorClass}`}>
                    {previewDelta.glyph} {formatPercent(currentPreview.change)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1e293b]">
                <div className="bg-[#111827] p-2.5 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-[#94a3b8] block uppercase">14D RSI</span>
                  <span className="text-sm font-bold text-white num-tabular mt-0.5 block">{currentPreview.rsi}</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Neutral-Bullish</span>
                </div>
                <div className="bg-[#111827] p-2.5 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-[#94a3b8] block uppercase">MACD</span>
                  <span className="text-xs font-bold text-white mt-1 block truncate">{currentPreview.macdSignal}</span>
                  <span className="text-[10px] text-[#64748b]">12/26 EMA</span>
                </div>
                <div className="bg-[#111827] p-2.5 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-[#94a3b8] block uppercase">Volume Ratio</span>
                  <span className="text-sm font-bold text-white num-tabular mt-0.5 block">{currentPreview.volumeRatio}x</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Above Avg</span>
                </div>
              </div>

              <Link href={`/stock/${currentPreview.symbol}`} className="block pt-2">
                <Button className="w-full text-xs font-semibold gap-2 bg-[#162032] hover:bg-[#1e293b] border border-[#293548] text-white">
                  <span>Open Full Analysis & Candlestick Chart</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </Button>
              </Link>
            </div>

            {/* 4-Desk Signals Right (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0b0f19] rounded-lg p-4 border border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Technical Desk</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">BULLISH</span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Price trading above 20-day and 50-day exponential moving averages. Stochastic momentum confirming continuation.
                </p>
                <div className="pt-2 text-[11px] text-[#64748b] border-t border-[#1e293b] flex justify-between">
                  <span>Support: ₹{(currentPreview.price * 0.98).toFixed(1)}</span>
                  <span>Resistance: ₹{(currentPreview.price * 1.03).toFixed(1)}</span>
                </div>
              </div>

              <div className="bg-[#0b0f19] rounded-lg p-4 border border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">News Intelligence Desk</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold">POSITIVE</span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Multiple verified Economic Times and Livemint headlines indicate positive order book visibility and stable margin projections.
                </p>
                <div className="pt-2 text-[11px] text-[#64748b] border-t border-[#1e293b] flex justify-between">
                  <span>Sources: 6 Citations</span>
                  <span className="text-emerald-400">Zero Rumors</span>
                </div>
              </div>

              <div className="bg-[#0b0f19] rounded-lg p-4 border border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Anomaly Desk</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">Z-SCORE +1.8</span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Volume accumulation cluster identified during early session trade. Standard statistical divergence test confirms genuine volume surge.
                </p>
                <div className="pt-2 text-[11px] text-[#64748b] border-t border-[#1e293b] flex justify-between">
                  <span>Confidence: 94%</span>
                  <span className="text-[#94a3b8]">Verified Math</span>
                </div>
              </div>

              <div className="bg-[#0b0f19] rounded-lg p-4 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Lead Synthesis Agent</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">FINAL VERDICT</span>
                </div>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  {currentPreview.agentVerdict}
                </p>
                <div className="pt-2 text-[11px] text-[#64748b] border-t border-[#1e293b] flex justify-between">
                  <span>Reconciled: 4/4 Desks</span>
                  <span className="text-emerald-400 font-semibold">High Conviction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SYSTEM WORKFLOW (5 STAGES) */}
        <section className="bg-[#111827] rounded-xl p-6 sm:p-8 border border-[#1e293b] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                System Workflow
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Multi-Stage Decision & Verification Flow
              </h2>
            </div>
            <Link
              href="/intelligence"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              Inspect Agent Trail <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-4 space-y-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wide">
                Stage 01
              </span>
              <h3 className="text-xs font-bold text-white uppercase">Market Data</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Live tick ingestion across NSE/BSE benchmark indices, monitored large-caps, and financial RSS headlines.
              </p>
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-4 space-y-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold uppercase tracking-wide">
                Stage 02
              </span>
              <h3 className="text-xs font-bold text-white uppercase">Deterministic Math</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Pure NumPy/Pandas calculation of 14D RSI, MACD, 20/50/200D SMAs, Bollinger Bands, and Volume Z-scores.
              </p>
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-4 space-y-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold uppercase tracking-wide">
                Stage 03
              </span>
              <h3 className="text-xs font-bold text-white uppercase">Specialized Desks</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                3 isolated agents (Technical, News Intelligence, Anomaly) analyze indicators concurrently without shared bias.
              </p>
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-4 space-y-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold uppercase tracking-wide">
                Stage 04
              </span>
              <h3 className="text-xs font-bold text-white uppercase">Lead Synthesis</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Lead Agent reconciles desk findings, flags anomalies, cross-audits sentiment, and drafts an executive memo.
              </p>
            </div>

            <div className="bg-[#0b0f19] border border-emerald-500/30 rounded-lg p-4 space-y-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wide">
                Stage 05
              </span>
              <h3 className="text-xs font-bold text-white uppercase">Intelligence Delivery</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Delivered with verified source citations, interactive charts, and reproducible research archives.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: CAPABILITY SECTION */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Institutional Research Without Noise
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Four specialized intelligence disciplines united under strict mathematical determinism and grounded verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Technical Analysis Desk</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Deterministic momentum indicators, trend regime detection, moving average cross-verification, and volatility boundaries.
              </p>
            </div>

            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">News Intelligence Desk</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Continuous ingestion of Economic Times and Livemint financial feeds with entity resolution and citation backlinks.
              </p>
            </div>

            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Anomaly Detection Desk</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Volume Z-score calculations and statistical divergence screening to detect institutional block accumulation.
              </p>
            </div>

            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Lead Synthesis Agent</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Reconciles all 3 desks to formulate grounded, contradictorily-tested executive memos and risk assessments.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: WORKSPACE MODULES PREVIEW */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Platform Modules
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Complete Workspace Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Seamless research navigation across six dedicated workstations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Dashboard', desc: 'Real-time Macro Pulse, Advance/Decline needle breadth gauge, and Nifty Movers.', route: '/dashboard' },
              { title: 'Markets', desc: 'Thematic sector rotation matrix ranking Auto, Energy, FMCG, Bank, and IT.', route: '/markets' },
              { title: 'Screener', desc: 'Equities universe screener with watchlist management and multi-parameter sorting.', route: '/stocks' },
              { title: 'Stock Deep-Dive', desc: 'Interactive candlestick engine, verified news timeline, and provenance ledger.', route: '/stock/RELIANCE' },
              { title: 'Multi-Agent Intelligence', desc: 'Hierarchical 4-desk reasoning trail with raw schema inspection.', route: '/intelligence' },
              { title: 'Ask MarketMind', desc: 'Conversational research terminal with citation cards and suggested follow-ups.', route: '/ask' },
            ].map((mod) => (
              <Link
                key={mod.title}
                href={mod.route}
                className="bg-[#111827] hover:bg-[#162032] rounded-xl p-5 border border-[#1e293b] hover:border-[#334155] block transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h4>
                  <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:text-emerald-400 transform group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {mod.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 6: EDUCATIONAL DISCLAIMER */}
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Educational & Analytical Purpose
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            MarketMind is an educational and analytical research project. Its outputs are research insights and not financial advice or instructions to buy or sell securities. Analytical signals are corroborated strictly against deterministic indicator math and verifiable news publisher RSS streams.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-[#64748b]">
            <span>• Pure Python indicator pre-calculations</span>
            <span>• Verifiable RSS links from Economic Times and Livemint</span>
            <span>• Zero automated order execution</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#1e293b] bg-[#0b0f19] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748b]">
          <div>
            MarketMind — AI-Powered Indian Stock Market Intelligence Agent
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Workspace</Link>
            <Link href="/markets" className="hover:text-emerald-400 transition-colors">Markets</Link>
            <Link href="/stocks" className="hover:text-emerald-400 transition-colors">Screener</Link>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}