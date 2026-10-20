import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const ReviewQueue: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Active review item being edited
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReviews(statusFilter || undefined);
      setReviews(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (reviewId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateReview(reviewId, {
        review_status: newStatus,
        reviewer_notes: notes || undefined
      });
      setSelectedReview(null);
      setNotes('');
      await fetchReviews();
    } catch (err: any) {
      alert(err?.message || 'Failed to update review status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manual Review Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop analyst adjudication. Review flagged records, annotate observations, and verify false positives.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {['PENDING', 'CONFIRMED_ISSUE', 'FALSE_POSITIVE', 'APPROVED', ''].map((stat) => (
          <button
            key={stat || 'ALL'}
            onClick={() => setStatusFilter(stat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === stat
                ? 'bg-brand-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {stat || 'ALL REVIEWS'}
          </button>
        ))}
      </div>

      {/* Main Review Items List */}
      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-400">{error}</div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Badge status={rev.review_status} />
                  <span className="text-sm font-bold text-white">{rev.full_name}</span>
                  <span className="text-xs font-mono text-slate-500">{rev.record_id}</span>
                </div>
                <span className="text-xs text-slate-500">
                  Queued: {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              {/* Attributes & Triggered Reasons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Identity Details</span>
                  <div className="mt-1 space-y-0.5 text-slate-300">
                    <div>Email: {rev.email || <span className="text-slate-600">None</span>}</div>
                    <div>Phone: {rev.phone || <span className="text-slate-600">None</span>}</div>
                    <div>Validation Status: <span className="text-amber-400 font-semibold">{rev.validation_status}</span></div>
                    {rev.is_duplicate && (
                      <div className="text-purple-400">Duplicate Group: {rev.duplicate_group_id}</div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Flagged Heuristic Rules</span>
                  <div className="mt-1 space-y-1">
                    {rev.rule_signals && rev.rule_signals.length > 0 ? (
                      rev.rule_signals.map((sig: any, idx: number) => (
                        <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                          <strong className="text-amber-400">{sig.rule_name}:</strong> {sig.description}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic">No specific rule violations recorded.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Existing Reviewer Notes */}
              {rev.reviewer_notes && (
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  <strong className="text-slate-300 font-medium">Reviewer Note:</strong> {rev.reviewer_notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedReview(rev)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  Edit / Add Note
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(rev.id, 'APPROVED')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Approve (Legitimate)
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(rev.id, 'CONFIRMED_ISSUE')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Confirm Issue
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(rev.id, 'FALSE_POSITIVE')}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Mark False Positive
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(rev.id, 'DISMISSED')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
            No records currently in the selected review status.
          </div>
        )}
      </div>

      {/* Review Adjudication Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              Adjudicate Review: {selectedReview.full_name} ({selectedReview.record_id})
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reviewer Notes &amp; Rationale</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter observations, verification details, or reasons for decision..."
                rows={4}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReview.id, 'APPROVED')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReview.id, 'CONFIRMED_ISSUE')}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500"
              >
                Confirm Issue
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReview.id, 'FALSE_POSITIVE')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
              >
                False Positive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
