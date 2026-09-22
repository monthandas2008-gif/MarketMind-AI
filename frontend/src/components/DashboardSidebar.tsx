'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, TrendingUp, Layers, ShieldCheck, 
  FileText, Terminal, ChevronLeft, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Key, Plus,
  Search, ShieldAlert, CheckCircle2, Star, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTracking } from '@/lib/tracking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onOpenSearch?: () => void;
  onOpenGemini?: () => void;
  onOpenAdmin?: () => void;
  activeSymbol?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function DashboardSidebar({
  collapsed,
  onToggle,
  onSelectSymbol,
  onOpenSearch,
  onOpenGemini,
  onOpenAdmin,
  activeSymbol = 'RELIANCE',
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { trackedStocks } = useTracking();

  const navItems = [
    { href: '/dashboard', label: 'Terminal', icon: Activity, badge: 'LIVE' },
    { href: '/markets', label: 'Market Map', icon: TrendingUp },
    { href: '/stocks', label: 'Screener', icon: Layers },
    { href: '/intelligence', label: 'Multi-Agent', icon: ShieldCheck, badge: '4 Desks' },
    { href: '/reports', label: 'Briefings', icon: FileText },
    { href: '/ask', label: 'Ask AI', icon: Terminal },
  ];

  // Quick bluechips for instant chart switching if user has few tracked stocks
  const quickTickers = trackedStocks.length > 0 
    ? trackedStocks.slice(0, 6).map((t) => t.symbol)
    : ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC'];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0b0f19] border-r border-[#1e293b] flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {/* TOP SECTION: BRAND & COLLAPSE TOGGLE */}
        <div>
          <div className="h-16 px-4 border-b border-[#1e293b] flex items-center justify-between">
            <Link 
              href="/"
              className={`flex items-center gap-2.5 transition-all overflow-hidden ${
                collapsed ? 'justify-center w-full' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              {!collapsed && (
                <div className="leading-tight truncate">
                  <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    Market<span className="text-emerald-400">Mind</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-medium block">
                    Institutional Desk
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle button on desktop */}
            {!collapsed && (
              <button
                type="button"
                onClick={onToggle}
                className="hidden lg:flex p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#162032] border border-transparent hover:border-[#1e293b] transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* QUICK SEARCH BUTTON */}
          <div className="p-3">
            <button
              type="button"
              onClick={onOpenSearch}
              className={`w-full flex items-center rounded-lg bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white transition-all text-xs group ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2 justify-between'
              }`}
              title="Search stocks (Cmd+K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {!collapsed && <span className="font-normal text-[11px]">Search stocks...</span>}
              </div>
              {!collapsed && (
                <kbd className="text-[10px] font-mono bg-[#162032] px-1.5 py-0.5 rounded border border-[#1e293b] text-[#64748b]">
                  ⌘K
                </kbd>
              )}
            </button>
          </div>

          {/* PRIMARY NAVIGATION ITEMS */}
          <div className="px-3 space-y-1">
            <div className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#475569] ${
              collapsed ? 'sr-only' : 'block'
            }`}>
              Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile?.()}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-lg text-xs font-medium transition-all ${
                    collapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2.5'
                  } ${
                    isActive
                      ? 'bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-[#64748b] group-hover:text-[#94a3b8]'
                  }`} />
                  
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Bar on Left */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-400 rounded-r" />
                  )}

                  {/* Floating tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 rounded bg-[#111827] text-white text-xs whitespace-nowrap border border-[#1e293b] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* INTERACTIVE TRACKED WATCHLIST IN SIDEBAR */}
          {!collapsed && (
            <div className="mt-5 px-3">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                  Live Watchlist
                </span>
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-0.5">
                {quickTickers.map((sym) => {
                  const isSelected = activeSymbol === sym;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => onSelectSymbol?.(sym)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all font-mono ${
                        isSelected
                          ? 'bg-[#162032] text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-[#334155]'}`} />
                        <span>{sym}</span>
                      </div>
                      <span className="text-[10px] text-[#64748b] group-hover:text-[#94a3b8]">
                        NSE
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AGENT MESH STATUS CHIP (EXPANDED ONLY) */}
          {!collapsed && (
            <div className="mt-5 px-3">
              <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1e293b] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Agent Mesh
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-[#64748b] leading-tight">
                  4 Intelligence Desks analyzing live tick data and news feeds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: SETTINGS, API KEY, PROFILE, AND EXPAND TOGGLE */}
        <div className="p-3 border-t border-[#1e293b] space-y-2">
          {/* Gemini API Key Trigger */}
          <button
            type="button"
            onClick={onOpenGemini}
            className={`w-full flex items-center rounded-lg text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#162032] border border-transparent hover:border-[#1e293b] transition-all ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2.5'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {!collapsed && <span className="text-xs truncate">Configure Gemini Key</span>}
          </button>

          {/* Master Admin User Approvals Trigger */}
          {(user?.role === 'admin' || user?.email === 'monthandas2008@gmail.com') && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`w-full flex items-center rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2 justify-between'
              }`}
              title="User Access Approvals"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {!collapsed && <span>User Approvals</span>}
              </div>
              {!collapsed && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Admin
                </span>
              )}
            </button>
          )}

          {/* User profile badge */}
          {user && (
            <div className={`flex items-center rounded-lg bg-[#111827] border border-[#1e293b] ${
              collapsed ? 'justify-center p-2' : 'p-2 gap-2.5'
            }`}>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                {user.name?.slice(0, 1) || 'A'}
              </div>
              {!collapsed && (
                <div className="truncate text-left leading-tight">
                  <span className="text-xs font-semibold text-white block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#64748b] block truncate">
                    {user.role || 'Equity Analyst'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse Toggle Button for Collapsed Mode */}
          {collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#162032] border border-[#1e293b] transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-full flex items-center justify-center p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#162032] border border-[#1e293b] text-xs font-medium"
          >
            Close Menu
          </button>
        </div>
      </aside>
    </>
  );
}
