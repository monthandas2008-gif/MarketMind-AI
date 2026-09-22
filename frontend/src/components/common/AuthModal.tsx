'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, 
  Key, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess
}: AuthModalProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFillDemo = () => {
    setEmail('demo.analyst@marketmind.ai');
    setPassword('MarketMind#2026');
    setName('Senior Quant Analyst');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (!email.includes('@')) {
        setError('Please provide a valid institutional or personal email address.');
        return;
      }
      if (password.length < 6) {
        setError('Security rule: Password must be at least 6 characters.');
        return;
      }

      login(email, mode === 'register' ? (name || 'Registered Analyst') : undefined);
      setSuccessMsg(
        mode === 'login'
          ? 'Authentication Verified! Unlocking Terminal...'
          : 'Registration Successful! Initializing Desk...'
      );
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        router.push('/dashboard');
      }, 700);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md bg-[#090d16] border-[#1a2333] p-6 sm:p-7">
        
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-lg mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            M
          </div>
          <h2 className="text-lg font-bold font-mono text-white tracking-tight">
            {mode === 'login' ? 'Institutional Terminal Access' : 'Create Research Desk Account'}
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono mt-1">
            {mode === 'login' 
              ? 'Sign in to access real-time Multi-Agent intelligence & live NSE telemetry.'
              : 'Register to unlock full single-stock deep dives & custom alerts.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#070a10] p-1 rounded-xl border border-[#1a2333] mb-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-all font-bold ${
              mode === 'login'
                ? 'bg-[#101624] text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-all font-bold ${
              mode === 'register'
                ? 'bg-[#101624] text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="mb-4 bg-[#090d16] border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-configured Demo Key</span>
          </div>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={handleFillDemo}
            className="text-[10px] font-bold"
          >
            Auto-Fill
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono" suppressHydrationWarning>
          {mode === 'register' && (
            <div>
              <label className="block text-[#94a3b8] mb-1">Full Name / Organization</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <Input
                  type="text"
                  required
                  placeholder="e.g. Manthan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#94a3b8] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <Input
                type="email"
                required
                placeholder="analyst@marketmind.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[#94a3b8]">Security Password</label>
              {mode === 'login' && (
                <span className="text-[10px] text-[#64748b] hover:text-emerald-400 cursor-pointer">
                  Forgot?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-8 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={loading}
            className="w-full font-mono text-xs font-bold gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <span>
              {loading
                ? 'Verifying...'
                : mode === 'login'
                ? 'Sign In to Workspace'
                : 'Initialize Account'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        {/* Security Footer */}
        <div className="mt-4 pt-3 border-t border-[#1a2333] flex items-center justify-between text-[10px] font-mono text-[#64748b]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Grounded Session Guard
          </span>
          <Badge variant="default">Zero Leak</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}