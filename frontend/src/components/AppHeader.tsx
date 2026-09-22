'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, Layers, FileText, Terminal, Key, 
  Search, ShieldCheck, TrendingUp, LogIn,
  Menu, LogOut, CheckCircle2, PanelLeftClose, PanelLeftOpen, ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import AuthModal from '@/components/common/AuthModal';
import AdminApprovalModal from '@/components/AdminApprovalModal';
import GlobalCommandMenu from '@/components/common/GlobalCommandMenu';
import MarketTickerTape from '@/components/common/MarketTickerTape';
import { useAuth } from '@/lib/auth';
import { getMarketSessionInfo, MarketSessionInfo } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AppHeaderProps {
  hideNav?: boolean;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function AppHeader({
  hideNav = false,
  onToggleSidebar,
  sidebarCollapsed = false,
}: AppHeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: userSession, logout } = useAuth();
  
  const [sessionInfo, setSessionInfo] = useState<MarketSessionInfo>(getMarketSessionInfo());
  const [istTime, setIstTime] = useState<string>('');
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  // Live IST Clock & Session Phase Sync
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setIstTime(now.toLocaleTimeString('en-GB', options) + ' IST');
      setSessionInfo(getMarketSessionInfo(now));
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Command Menu Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    try {
      await api.setGeminiKey(apiKeyInput.trim());
      setKeySaved(true);
      setTimeout(() => {
        setGeminiModalOpen(false);
        setKeySaved(false);
      }, 1200);
    } catch (e) {
      console.error('Failed to set Gemini API key:', e);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    { href: '/markets', label: 'Markets', icon: TrendingUp },
    { href: '/stocks', label: 'Screener', icon: Layers },
    { href: '/intelligence', label: 'Intelligence', icon: ShieldCheck },
    { href: '/reports', label: 'Daily Briefings', icon: FileText },
    { href: '/ask', label: 'Ask AI', icon: Terminal },
  ];

  return (
    <>
      {/* Top Benchmark Index Tape */}
      <MarketTickerTape />

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f19]/95 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Brand / Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg bg-[#111827] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-colors"
                title={sidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-[#94a3b8]" />
                )}
              </button>
            )}

            {!hideNav ? (
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center transition-all group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                    Market<span className="text-emerald-400">Mind</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Terminal
                </span>
                <span className="text-[11px] text-[#64748b] hidden sm:inline font-medium">
                  • Real-Time Indian Equities Intelligence
                </span>
              </div>
            )}

            {/* Desktop Navigation Links (only shown when hideNav is false) */}
            {!hideNav && (
              <nav className="hidden lg:flex items-center gap-1 ml-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Actions: Search (Cmd+K), Market Status, User */}
          <div className="flex items-center gap-3">
            
            {/* Prominent Global Command Search Bar (Cmd+K) */}
            <button
              onClick={() => setCommandMenuOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white transition-all text-xs group"
              title="Search stocks, sectors, or press Cmd+K"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-xs text-[#94a3b8] group-hover:text-white font-normal">
                Search stocks, sectors...
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-[#162032] px-1.5 py-0.5 rounded border border-[#293548] text-[#94a3b8]">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* Market Session Status Pill */}
            <div 
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${sessionInfo.badgeClass}`}
              title={sessionInfo.description}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.dotClass}`} />
              <span className="font-semibold">{sessionInfo.label}</span>
              <span className="text-[#94a3b8] text-[10px] pl-1 border-l border-[#1e293b] num-tabular">
                {istTime ? istTime.split(' ')[0] : '09:15:00'}
              </span>
            </div>

            {/* Gemini API Key Config */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGeminiModalOpen(true)}
              className="hidden sm:inline-flex text-[#94a3b8] hover:text-white border-[#1e293b] bg-[#111827] text-xs"
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              <span>API Key</span>
            </Button>

            {/* User Session / Sign In CTA */}
            {userSession ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-[#162032] hover:bg-[#1e293b] border border-[#293548] text-xs text-white transition-all focus:outline-none">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                      {userSession.name?.slice(0, 1) || 'A'}
                    </div>
                    <span className="font-medium truncate max-w-[80px]">
                      {userSession.name?.split(' ')[0] || 'Analyst'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 bg-[#111827] border-[#1e293b]">
                  <DropdownMenuLabel className="pb-1">
                    <div className="font-semibold text-white text-xs">{userSession.name}</div>
                    <div className="text-[10px] text-[#94a3b8] truncate">{userSession.email}</div>
                    <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-medium">
                      {userSession.role || 'Equity Analyst'}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#1e293b]" />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <Activity className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/intelligence')}>
                    <ShieldCheck className="mr-2 h-3.5 w-3.5 text-teal-400" />
                    <span>Multi-Agent Desk</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGeminiModalOpen(true)}>
                    <Key className="mr-2 h-3.5 w-3.5 text-amber-400" />
                    <span>Configure Gemini Key</span>
                  </DropdownMenuItem>
                  {(userSession.role === 'admin' || userSession.email === 'monthandas2008@gmail.com') && (
                    <DropdownMenuItem onClick={() => setAdminModalOpen(true)} className="text-amber-400 focus:text-amber-300">
                      <ShieldAlert className="mr-2 h-3.5 w-3.5 text-amber-400" />
                      <span>User Approvals</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#1e293b]" />
                  <DropdownMenuItem onClick={logout} className="text-rose-400 focus:text-rose-300">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-3"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                <span>Sign In</span>
              </Button>
            )}

            {/* Mobile Nav Toggle */}
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden p-1.5 rounded-lg bg-[#111827] border border-[#1e293b] text-[#94a3b8] hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#1e293b] bg-[#111827] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/20'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Command Search Menu (Cmd+K / Ctrl+K) */}
      <GlobalCommandMenu
        open={commandMenuOpen}
        onOpenChange={setCommandMenuOpen}
        onOpenGeminiModal={() => setGeminiModalOpen(true)}
      />

      {/* Quick Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Gemini API Key Dialog */}
      <Dialog open={geminiModalOpen} onOpenChange={setGeminiModalOpen}>
        <DialogContent className="max-w-md bg-[#111827] border-[#1e293b]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <DialogTitle className="text-white text-sm font-semibold">Configure Google Gemini Flash API</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#94a3b8] pt-1">
              Provide your Gemini API key to activate real-time multi-agent reasoning, sentiment extraction, and synthesis desks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94a3b8]">API Key</label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="bg-[#0b0f19] border-[#1e293b] text-white"
              />
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGeminiModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!apiKeyInput.trim()}
              >
                {keySaved ? (
                  <span className="flex items-center gap-1 text-black font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Activated!
                  </span>
                ) : (
                  'Save & Activate Key'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Master Admin User Approval Modal */}
      <AdminApprovalModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </>
  );
}