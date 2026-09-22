'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import AppHeader from '@/components/AppHeader';
import StockSearchModal from '@/components/common/StockSearchModal';
import AdminApprovalModal from '@/components/AdminApprovalModal';
import { api } from '@/lib/api';

interface AppShellProps {
  children: React.ReactNode;
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  title?: string;
}

export default function AppShell({
  children,
  activeSymbol = 'RELIANCE',
  onSelectSymbol,
  title,
}: AppShellProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Persist sidebar collapsed preference in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('marketmind_sidebar_collapsed');
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('marketmind_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleHeaderToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      handleToggleSidebar();
    }
  };

  const handleSelectSymbol = (sym: string) => {
    if (onSelectSymbol) {
      onSelectSymbol(sym);
    } else {
      router.push(`/stock/${sym}`);
    }
    setMobileSidebarOpen(false);
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    if (!geminiKeyInput.trim() || geminiKeyInput.trim().length < 15) {
      setKeyError('API Key must be at least 15 characters.');
      return;
    }
    try {
      await api.setGeminiKey(geminiKeyInput.trim());
      setKeySaved(true);
      setTimeout(() => {
        setGeminiModalOpen(false);
        setKeySaved(false);
        setGeminiKeyInput('');
      }, 1200);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save Gemini key';
      setKeyError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] flex font-sans">
      {/* Interactive Collapsible Left Navigation Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onSelectSymbol={handleSelectSymbol}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenGemini={() => setGeminiModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        activeSymbol={activeSymbol}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          hideNav={true}
          onToggleSidebar={handleHeaderToggle}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Stock Search Modal accessible from Sidebar & Shortcut */}
      <StockSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Admin User Approval Modal */}
      <AdminApprovalModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* Dynamic Gemini API Key Dialog */}
      {geminiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">AI</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configure Gemini API Key</h3>
                  <p className="text-[11px] text-[#64748b]">Insert your personal Gemini key for unlimited AI chat</p>
                </div>
              </div>
              <button 
                onClick={() => setGeminiModalOpen(false)}
                className="text-[#64748b] hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGeminiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#0b0f19] border border-[#1e293b] text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                  autoFocus
                />
                <p className="text-[10px] text-[#64748b] mt-1.5">
                  Keys are stored securely per user and used for multi-agent synthesis and conversational chat.
                </p>
              </div>

              {keyError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  {keyError}
                </div>
              )}

              {keySaved && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  Key configured successfully! Unlimited queries unlocked.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setGeminiModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#1e293b] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#162032] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold shadow transition-colors"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
