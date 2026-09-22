'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, 
  AlertCircle, Eye, EyeOff, Clock
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
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
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
          setSuccessMsg('Authentication verified! Launching terminal...');
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
            router.push('/dashboard');
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
          setSuccessMsg('Administrator account verified! Launching terminal...');
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
            router.push('/dashboard');
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
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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
            {mode === 'login' ? 'MarketMind Terminal Access' : 'Create Research Desk Account'}
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono mt-1">
            {mode === 'login' 
              ? 'Authorized access only. Sign in with your approved credentials.'
              : 'New analyst accounts require administrator approval before terminal access.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#070a10] p-1 rounded-xl border border-[#1a2333] mb-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setPendingNotice(''); }}
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
            onClick={() => { setMode('register'); setError(''); setPendingNotice(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-all font-bold ${
              mode === 'register'
                ? 'bg-[#101624] text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Register
          </button>
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
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[#94a3b8]">Security Password</label>
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
                ? 'Sign In to Terminal'
                : 'Request Account Access'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        {/* Security Footer */}
        <div className="mt-4 pt-3 border-t border-[#1a2333] flex items-center justify-between text-[10px] font-mono text-[#64748b]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Grounded Session Guard
          </span>
          <Badge variant="default">Private & Encrypted</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}