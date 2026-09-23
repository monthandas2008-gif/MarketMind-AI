'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, 
  AlertCircle, Eye, EyeOff, ArrowLeft, RefreshCw, ShieldAlert, Clock
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const wasRedirected = Boolean(searchParams.get('redirect'));

  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingNotice('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!email.includes('@')) {
        setError('Please provide a valid email address.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Security rule: Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          setSuccessMsg('Authentication verified. Launching terminal...');
          setTimeout(() => {
            router.push(redirectTarget);
          }, 600);
        } else if (result.status === 'pending') {
          setPendingNotice(
            result.message ||
            'Your account is pending administrator approval by monthandas2008@gmail.com. Access will be unlocked once approved.'
          );
        } else {
          setError(result.message || 'Invalid credentials or access rejected.');
        }
      } else {
        if (!name.trim()) {
          setError('Please provide your full name or organization.');
          setLoading(false);
          return;
        }

        const result = await register(email, password, name);
        if (result.success && result.status === 'approved') {
          setSuccessMsg('Administrator account verified. Launching terminal...');
          setTimeout(() => {
            router.push(redirectTarget);
          }, 600);
        } else if (result.status === 'pending') {
          setPendingNotice(
            result.message ||
            'Registration submitted successfully! Your account is pending administrator approval by monthandas2008@gmail.com. You will be able to log in once approved.'
          );
          setMode('login');
        } else {
          setError(result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 relative z-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition-colors mb-2 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Public Overview
      </Link>

      {/* Redirect Notice */}
      {wasRedirected && (
        <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Access Restricted: Sign in to access live terminal telemetry & analysis.</span>
        </div>
      )}

      <div className="bg-[#111827] rounded-xl p-6 sm:p-8 border border-[#1e293b] shadow-xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xl mb-3">
            M
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'MarketMind Terminal Access' : 'Register Analyst Desk'}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1.5">
            {mode === 'login' 
              ? 'Authorized access only. Sign in with your approved credentials.'
              : 'New analyst accounts require administrator approval before terminal access.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-[#1e293b] mb-5 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setPendingNotice(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all font-semibold ${
              mode === 'login'
                ? 'bg-[#111827] text-white border border-[#1e293b] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setPendingNotice(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all font-semibold ${
              mode === 'register'
                ? 'bg-[#111827] text-white border border-[#1e293b] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs" suppressHydrationWarning>
          {mode === 'register' && (
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Full Name / Organization</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <Input
                  type="text"
                  required
                  placeholder="e.g. Manthan Das"
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

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full text-xs font-semibold gap-2 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] h-10 mt-2"
          >
            <span>
              {loading
                ? 'Verifying Credentials...'
                : mode === 'login'
                ? 'Enter Research Terminal'
                : 'Request Account Access'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded Session Guard
          </span>
          <span className="text-[11px] text-[#64748b]">Private & Encrypted</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center">
        <Suspense fallback={
          <div className="text-xs text-[#94a3b8] flex items-center gap-2 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Initializing Access Terminal...
          </div>
        }>
          <LoginFormContent />
        </Suspense>
      </main>
    </div>
  );
}