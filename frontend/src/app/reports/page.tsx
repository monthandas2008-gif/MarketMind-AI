'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, Calendar, RefreshCw, 
  Activity, Newspaper, AlertTriangle, ChevronRight, Printer,
  Copy, Check, Bookmark, Plus
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import SignalBadge from '@/components/common/SignalBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { DailyReport, ReportSummary, UserDailyReport } from '@/lib/types';
import { useTracking } from '@/lib/tracking';
import { formatINR, formatPercent, getDeltaMeta } from '@/lib/formatters';

export default function ReportsPage() {
  const { trackedStocks } = useTracking();
  const [reportTab, setReportTab] = useState<'portfolio' | 'macro'>('portfolio');

  // Macro reports state
  const [macroReportsList, setMacroReportsList] = useState<ReportSummary[]>([]);
  const [activeMacroReport, setActiveMacroReport] = useState<DailyReport | null>(null);

  // Personalized user reports state
  const [userReportsList, setUserReportsList] = useState<UserDailyReport[]>([]);
  const [activeUserReport, setActiveUserReport] = useState<UserDailyReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const [macroList, macroLatest, userReports] = await Promise.allSettled([
          api.getReportsList(),
          api.getLatestReport(),
          api.getUserDailyReports(),
        ]);

        if (!isMounted) return;
        if (macroList.status === 'fulfilled') setMacroReportsList(macroList.value);
        if (macroLatest.status === 'fulfilled') setActiveMacroReport(macroLatest.value);
        if (userReports.status === 'fulfilled' && userReports.value.length > 0) {
          setUserReportsList(userReports.value);
          setActiveUserReport(userReports.value[0]);
          setReportTab('portfolio');
        } else {
          setReportTab('portfolio');
        }
      } catch (e) {
        console.error('Error fetching reports:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectMacroReport = async (dateStr: string) => {
    try {
      setLoading(true);
      const r = await api.getReport(dateStr);
      setActiveMacroReport(r);
    } catch (e) {
      console.error('Failed to load macro report for date:', dateStr, e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserReport = async (dateStr: string) => {
    try {
      setLoading(true);
      const r = await api.getUserDailyReportByDate(dateStr);
      setActiveUserReport(r);
    } catch (e) {
      console.error('Failed to load user report for date:', dateStr, e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      if (reportTab === 'portfolio') {
        const newReport = await api.generateUserDailyReport();
        setActiveUserReport(newReport);
        const updatedUserList = await api.getUserDailyReports();
        setUserReportsList(updatedUserList);
      } else {
        const newReport = await api.generateReport();
        setActiveMacroReport(newReport);
        const updatedList = await api.getReportsList();
        setMacroReportsList(updatedList);
      }
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentSummary = reportTab === 'portfolio' ? activeUserReport?.market_summary : activeMacroReport?.market_summary;
  const currentDate = reportTab === 'portfolio' ? activeUserReport?.report_date : activeMacroReport?.report_date;
  const currentNiftyClose = reportTab === 'portfolio' ? activeUserReport?.nifty_close : activeMacroReport?.nifty_close;
  const currentNiftyChange = reportTab === 'portfolio' ? activeUserReport?.nifty_change_percent : activeMacroReport?.nifty_change_percent;

  const handleCopyMemo = () => {
    if (!currentSummary) return;
    const content = `MarketMind Institutional Briefing — ${currentDate}\n\nNifty 50 Close: ${currentNiftyClose} (${formatPercent(currentNiftyChange || 0)})\n\nLead Synthesis:\n${currentSummary}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Determine current active snapshot of symbols
  const activeSnapshot: string[] = reportTab === 'portfolio'
    ? (activeUserReport?.stocks_snapshot || trackedStocks.map((s) => s.symbol))
    : ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC'];

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Daily Multi-Agent Intelligence Briefings
              </h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Institutional multi-desk briefings synthesizing macroeconomic benchmark flows with single-stock intelligence across your tracked portfolio.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMemo}
              disabled={loading || (!activeUserReport && !activeMacroReport)}
              className="text-xs text-[#94a3b8] hover:text-white gap-1.5 border-[#1e293b] bg-[#111827] h-8"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Memo'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs text-[#94a3b8] hover:text-white gap-1.5 border-[#1e293b] bg-[#111827] h-8"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateReport}
              disabled={generating}
              className="text-xs font-semibold gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>
                {generating 
                  ? 'Synthesizing Desks...' 
                  : reportTab === 'portfolio' 
                  ? 'Generate Portfolio Memo' 
                  : 'Generate Macro Briefing'}
              </span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher: Personalized Tracked Portfolio vs Macro Market */}
        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 text-xs">
          <button
            type="button"
            onClick={() => setReportTab('portfolio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              reportTab === 'portfolio'
                ? 'bg-[#162032] text-amber-400 border border-[#293548]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111827] border border-transparent'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-amber-400/60 text-amber-400" />
            <span>Tracked Portfolio Briefings ({userReportsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setReportTab('macro')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              reportTab === 'macro'
                ? 'bg-[#162032] text-emerald-400 border border-[#293548]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111827] border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Macro Indian Market Briefings ({macroReportsList.length})</span>
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          
          {/* Sidebar: Historical Reports Archive */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {reportTab === 'portfolio' ? 'Portfolio Briefings' : 'Macro Archive'}
            </h2>

            <div className="space-y-1.5">
              {reportTab === 'portfolio' ? (
                userReportsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293b] text-xs text-[#64748b] text-center space-y-2">
                    <p>No customized portfolio briefings yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="text-xs border-[#1e293b] text-emerald-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Generate First Memo
                    </Button>
                  </div>
                ) : (
                  userReportsList.map((rep) => {
                    const isSelected = activeUserReport?.report_date === rep.report_date;
                    return (
                      <button
                        key={rep.report_date}
                        type="button"
                        onClick={() => handleSelectUserReport(rep.report_date)}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                          isSelected
                            ? 'bg-[#162032] border-amber-500/50 text-white shadow-sm'
                            : 'bg-[#111827] border-[#1e293b] text-[#94a3b8] hover:bg-[#162032]/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-mono">{rep.report_date}</span>
                          <span className="text-[11px] text-amber-400/80 font-normal">
                            {rep.stocks_snapshot?.length || 0} stocks
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#64748b] line-clamp-1">
                          {rep.market_summary}
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                macroReportsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293b] text-xs text-[#64748b] text-center">
                    No macro briefings found.
                  </div>
                ) : (
                  macroReportsList.map((rep) => {
                    const isSelected = activeMacroReport?.report_date === rep.report_date;
                    return (
                      <button
                        key={rep.report_date}
                        type="button"
                        onClick={() => handleSelectMacroReport(rep.report_date)}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                          isSelected
                            ? 'bg-[#162032] border-emerald-500/50 text-white shadow-sm'
                            : 'bg-[#111827] border-[#1e293b] text-[#94a3b8] hover:bg-[#162032]/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-mono">{rep.report_date}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-[#64748b]'}`} />
                        </div>
                        <div className="mt-1 text-[11px] text-[#64748b] line-clamp-1">
                          {rep.market_summary}
                        </div>
                      </button>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Main Content: Active Report Document */}
          <div className="lg:col-span-3 space-y-5">
            {loading ? (
              <div className="p-8 rounded-xl bg-[#111827] border border-[#1e293b] space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              </div>
            ) : reportTab === 'portfolio' ? (
              activeUserReport ? (
                <article className="space-y-5">
                  {/* Report Header Card */}
                  <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
                      <div>
                        <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                          Portfolio Briefing • {activeSnapshot.length} Analyzed Equities
                        </span>
                        <h2 className="text-xl font-bold text-white mt-0.5">
                          Tracked Equities Intelligence Memo: <span className="font-mono">{activeUserReport.report_date}</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-[#64748b] block uppercase">NIFTY 50 BENCHMARK</span>
                          <span className="text-sm font-bold text-white num-tabular">
                            {formatINR(activeUserReport.nifty_close || 0)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold num-tabular border ${getDeltaMeta(activeUserReport.nifty_change_percent || 0).badgeClass}`}>
                          {formatPercent(activeUserReport.nifty_change_percent || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Historical Stocks Snapshot */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase text-[#64748b] block">
                        Analyzed Portfolio Snapshot ({activeSnapshot.length} instruments):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        {activeSnapshot.map((stk) => (
                          <Link
                            key={stk}
                            href={`/stock/${stk}`}
                            className="px-2 py-0.5 rounded bg-[#0b0f19] border border-[#1e293b] hover:border-emerald-500/50 text-white font-mono text-[11px] transition-colors"
                          >
                            {stk}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-[#94a3b8] uppercase mb-1">
                        Portfolio Synthesis Thesis
                      </h3>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed">
                        {activeUserReport.market_summary}
                      </p>
                    </div>
                  </div>

                  {/* Section: Tri-Desk Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Technical Desk</span>
                      </div>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">
                        {activeUserReport.technical_developments || 'Technical levels evaluated across tracked portfolio holdings.'}
                      </p>
                    </div>

                    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>News Desk</span>
                      </div>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">
                        {activeUserReport.news_intelligence || 'Sentiment analysis across tracked stock announcements and regulatory filings.'}
                      </p>
                    </div>

                    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Anomaly Desk</span>
                      </div>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">
                        {activeUserReport.cross_stock_insights || 'Statistical volume spikes and momentum shifts across your tracked stocks.'}
                      </p>
                    </div>
                  </div>

                  {/* Tracked Individual Stock Analyses Cards */}
                  {activeUserReport.analyses && Object.keys(activeUserReport.analyses).length > 0 && (
                    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Multi-Desk Intelligence Across Tracked Instruments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {Object.entries(activeUserReport.analyses).map(([sym, ana]) => (
                          <div
                            key={sym}
                            className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-3.5 space-y-2 hover:border-[#334155] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm font-mono">{sym}</span>
                              <SignalBadge signal={ana.synthesis?.signal || 'neutral'} size="sm" />
                            </div>
                            <p className="text-xs text-[#cbd5e1] line-clamp-3 leading-relaxed">
                              {ana.synthesis?.findings || ana.technical?.findings || 'Analysis complete.'}
                            </p>
                            <div className="pt-2 border-t border-[#1e293b] flex justify-between items-center text-[11px]">
                              <span className="text-[#64748b]">Confidence: {ana.synthesis?.confidence || 'moderate'}</span>
                              <Link href={`/stock/${sym}`} className="text-emerald-400 hover:underline font-medium">
                                Deep Dive →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educational Disclaimer */}
                  <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-xs text-[#64748b]">
                    <strong className="text-white block mb-1">Educational & Analytical Purpose</strong>
                    MarketMind is an educational and analytical platform. Its multi-desk outputs are quantitative research insights and not financial advice or instructions to buy or sell securities.
                  </div>
                </article>
              ) : (
                <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293b] text-center text-xs text-[#64748b] space-y-3">
                  <p>You have not generated any customized portfolio briefings yet.</p>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] font-semibold text-xs h-9"
                  >
                    Generate Briefing for My Tracked Stocks
                  </Button>
                </div>
              )
            ) : activeMacroReport ? (
              <article className="space-y-5">
                {/* Macro Report Header Card */}
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                        MarketMind Macro Briefing
                      </span>
                      <h2 className="text-xl font-bold text-white mt-0.5">
                        Indian Equities Daily Intelligence: <span className="font-mono">{activeMacroReport.report_date}</span>
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748b] block uppercase">NIFTY 50 CLOSE</span>
                        <span className="text-sm font-bold text-white num-tabular">
                          {formatINR(activeMacroReport.nifty_close)}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold num-tabular border ${getDeltaMeta(activeMacroReport.nifty_change_percent).badgeClass}`}>
                        {formatPercent(activeMacroReport.nifty_change_percent)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#94a3b8] uppercase mb-1">
                      Lead Synthesis Agent Executive Summary
                    </h3>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed">
                      {activeMacroReport.market_summary}
                    </p>
                  </div>
                </div>

                {/* Section: Tri-Desk Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Technical Desk</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      {activeMacroReport.technical_intelligence || 'Consolidated technical signals across top monitored bluechips.'}
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>News Desk</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      {activeMacroReport.news_intelligence || 'Sentiment synthesis across corporate earnings and macroeconomic releases.'}
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Anomaly Desk</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      {activeMacroReport.anomalies || 'Statistical volume spikes and price deviations detected across the session.'}
                    </p>
                  </div>
                </div>

                {/* Educational Disclaimer */}
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-xs text-[#64748b]">
                  <strong className="text-white block mb-1">Educational & Analytical Purpose</strong>
                  MarketMind is an educational and analytical platform. Its outputs are research insights and not financial advice or instructions to buy or sell securities.
                </div>
              </article>
            ) : (
              <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293b] text-center text-xs text-[#64748b]">
                Select an archived briefing from the sidebar or generate a fresh synthesis report.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}