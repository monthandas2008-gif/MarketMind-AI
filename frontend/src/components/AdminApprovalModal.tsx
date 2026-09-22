'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, UserCheck, UserX, Clock, Users, RefreshCw, 
  AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePendingCount?: (count: number) => void;
}

export default function AdminApprovalModal({
  isOpen,
  onClose,
  onUpdatePendingCount,
}: AdminApprovalModalProps) {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.getPendingUsers().catch(() => ({ count: 0, users: [] })),
        api.getAllUsers().catch(() => ({ count: 0, users: [] })),
      ]);

      const pendingList = pendingRes.users || [];
      setPendingUsers(pendingList);
      setAllUsers(allRes.users || []);
      if (onUpdatePendingCount) {
        onUpdatePendingCount(pendingList.length);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to fetch user directory.',
      });
    } finally {
      setLoading(false);
    }
  }, [onUpdatePendingCount]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  const handleAction = async (email: string, action: 'approve' | 'reject') => {
    setActionLoading(email);
    setFeedback(null);
    try {
      const res = await api.approveUser(email, action);
      setFeedback({
        type: 'success',
        message: `Account ${email} successfully ${res.new_status}.`,
      });
      // Refresh list
      await fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || `Failed to ${action} user.`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="bullish">Approved</Badge>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Pending Approval</span>;
      case 'rejected':
        return <Badge variant="bearish">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl bg-[#0f172a] border-[#1e293b] p-6 text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                User Access Control & Approvals
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                  Master Admin
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Review and approve registration requests to grant terminal access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-[#111827] border border-[#1e293b] text-[#94a3b8] hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-[#1e293b] my-4 text-xs">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === 'pending'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Requests</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-[#0b0f19] font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === 'all'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Users ({allUsers.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8] text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Fetching user records...</span>
            </div>
          )}

          {!loading && tab === 'pending' && (
            <>
              {pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#94a3b8] space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">No Pending Requests</p>
                  <p className="text-xs text-[#64748b] max-w-sm">
                    All user accounts are currently approved or reviewed. Any new registration will appear here for your explicit authorization.
                  </p>
                </div>
              ) : (
                pendingUsers.map((u) => (
                  <div
                    key={u.id || u.email}
                    className="p-3.5 rounded-lg bg-[#0b0f19] border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{u.name || 'Analyst'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Pending</span>
                      </div>
                      <div className="text-[#94a3b8] font-mono text-[11px] truncate">{u.email}</div>
                      <div className="text-[10px] text-[#64748b]">
                        Registered: {u.created_at ? new Date(u.created_at).toLocaleString('en-IN') : 'Recently'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionLoading === u.email}
                        onClick={() => handleAction(u.email, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-8 px-3"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading === u.email}
                        onClick={() => handleAction(u.email, 'reject')}
                        className="text-xs font-semibold gap-1.5 h-8 px-3"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && tab === 'all' && (
            <>
              {allUsers.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#94a3b8]">
                  No user records found.
                </div>
              ) : (
                allUsers.map((u) => (
                  <div
                    key={u.id || u.email}
                    className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{u.name || 'User'}</span>
                        {getStatusBadge(u.status)}
                        {u.role === 'admin' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[#94a3b8] font-mono text-[11px] truncate">{u.email}</div>
                      <div className="text-[10px] text-[#64748b]">
                        Created: {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </div>

                    {u.role !== 'admin' && (
                      <div className="flex items-center gap-2 shrink-0">
                        {u.status !== 'approved' ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={actionLoading === u.email}
                            onClick={() => handleAction(u.email, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                          >
                            Approve
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === u.email}
                            onClick={() => handleAction(u.email, 'reject')}
                            className="text-xs h-7 px-2.5"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Restricted Admin Privilege: monthandas2008@gmail.com
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-7 px-3 border-[#1e293b] text-[#94a3b8] hover:text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
