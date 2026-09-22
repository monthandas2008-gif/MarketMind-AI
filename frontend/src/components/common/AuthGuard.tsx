'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in via localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('marketmind_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.sessionActive || parsed.email)) {
            queueMicrotask(() => {
              setIsAuthenticated(true);
              setChecking(false);
            });
            return;
          }
        }
      } catch {
        // ignore JSON parse error
      }

      queueMicrotask(() => {
        setIsAuthenticated(false);
        setChecking(false);
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${returnUrl}`);
      });
    }
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#05070c] text-[#f1f5f9] flex flex-col items-center justify-center p-6 font-mono">
        <div className="glass-panel p-8 rounded-2xl border border-[#1a2333] flex flex-col items-center gap-3 max-w-sm w-full text-center shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Verifying Security Session</h2>
          <p className="text-xs text-[#94a3b8]">Checking institutional analyst authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070c] text-[#f1f5f9] flex flex-col items-center justify-center p-6 font-mono">
        <div className="glass-panel p-8 rounded-2xl border border-[#1a2333] flex flex-col items-center gap-4 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Authentication Required</h2>
            <p className="text-xs text-[#94a3b8] mt-1">
              This terminal view is protected. You must sign in or register to access Multi-Agent reasoning, live NSE indicators, and deep-dive analytics.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full pt-2">
            <Link
              href="/"
              className="flex-1 py-2 rounded-lg bg-[#070a10] border border-[#1a2333] text-xs text-[#94a3b8] hover:text-white transition-colors"
            >
              Public Overview
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}