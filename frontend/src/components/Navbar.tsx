'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, MessageSquare, FileText, Search, Key } from 'lucide-react';
import { api } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  useEffect(() => {
    async function check() {
      try {
        const health = await api.checkHealth();
        setIsOnline(health.status === 'online');
        setGeminiConfigured(health.gemini_configured);
      } catch {
        setIsOnline(false);
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setSavingKey(true);
    setKeyMessage('');
    try {
      const res = await api.setGeminiKey(inputKey.trim());
      setGeminiConfigured(res.gemini_configured);
      setKeyMessage('Key saved successfully! AI reasoning will now use your key.');
      setTimeout(() => {
        setShowKeyModal(false);
        setKeyMessage('');
        setInputKey('');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setKeyMessage(`Error: ${message}`);
    } finally {
      setSavingKey(false);
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/stock/RELIANCE', label: 'Stock Analysis', icon: Search },
    { href: '/ask', label: 'Ask MarketMind', icon: MessageSquare },
    { href: '/reports', label: 'Daily Reports', icon: FileText },
  ];

  return (
    <>
      <header className="border-b border-gray-800 bg-[#0f1117]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center transition-all group-hover:border-emerald-400">
                <span className="text-emerald-400 font-bold text-base tracking-wider">M</span>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">
                  Market<span className="text-emerald-400">Mind</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-gray-500 ml-2 font-mono">
                  NSE/BSE Intelligence
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gray-800/80 text-emerald-400 border border-gray-700/60'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Status & Key configuration */}
            <div className="flex items-center gap-3">
              {/* Gemini Key Config Button */}
              <button
                onClick={() => setShowKeyModal(true)}
                suppressHydrationWarning
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                  geminiConfigured
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/30'
                }`}
                title="Configure Gemini API Key"
              >
                <Key className="w-3 h-3" />
                <span className="hidden sm:inline">Gemini:</span>
                <span>{geminiConfigured ? 'Active' : 'Fallback / Set Key'}</span>
              </button>

              {/* Server State Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline === true
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : isOnline === false
                      ? 'bg-rose-500'
                      : 'bg-gray-500 animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
                  {isOnline ? 'LIVE' : isOnline === false ? 'OFFLINE' : 'CHECKING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal for setting Gemini API key */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151922] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Configure Gemini API Key
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-gray-400 hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Enter your Google Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google AI Studio</a> (Free tier: 15 RPM).
              Your key is sent directly to your local backend memory and is never logged or exposed.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  API Key (GEMINI_API_KEY)
                </label>
                <input
                  suppressHydrationWarning
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {keyMessage && (
                <div className={`p-2.5 rounded text-xs ${keyMessage.startsWith('Error') ? 'bg-rose-950/50 text-rose-300 border border-rose-800/50' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'}`}>
                  {keyMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {savingKey ? 'Saving...' : 'Apply Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
