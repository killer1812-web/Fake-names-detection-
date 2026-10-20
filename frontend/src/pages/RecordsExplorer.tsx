import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Download,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { IdentityRecord, PaginatedRecords } from '../types';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const RecordsExplorer: React.FC = () => {
  const [data, setData] = useState<PaginatedRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  // Detail Modal state
  const [selectedRecord, setSelectedRecord] = useState<IdentityRecord | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const isDup = duplicateFilter === 'true' ? true : duplicateFilter === 'false' ? false : undefined;
      const res = await api.getRecords({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        validation_status: validationStatus || undefined,
        review_status: reviewStatus || undefined,
        is_duplicate: isDup,
        sort_by: sortBy,
        sort_desc: sortDesc,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, validationStatus, reviewStatus, duplicateFilter, sortBy, sortDesc]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleExportFiltered = () => {
    window.open(api.exportReportUrl('csv'), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Records Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect normalized identity records and audit heuristic explanations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportFiltered}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchRecords}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Record ID, full name, or email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-medium">Filters:</span>
          </div>

          <select
            value={validationStatus}
            onChange={(e) => {
              setValidationStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"
          >
            <option value="">All Validation Statuses</option>
            <option value="VALID">VALID</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="INVALID_FORMAT">INVALID_FORMAT</option>
            <option value="MISSING_FIELDS">MISSING_FIELDS</option>
          </select>

          <select
            value={reviewStatus}
            onChange={(e) => {
              setReviewStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"
          >
            <option value="">All Review Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED_ISSUE">CONFIRMED_ISSUE</option>
            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>

          <select
            value={duplicateFilter}
            onChange={(e) => {
              setDuplicateFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"
          >
            <option value="all">All Records</option>
            <option value="true">Duplicates Only</option>
            <option value="false">Non-Duplicates Only</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 text-xs">
              Showing {data?.items.length || 0} of {data?.total || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={10} />
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-400">{error}</div>
        ) : data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Record ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Validation</th>
                  <th className="px-4 py-3">Duplicate?</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{r.record_id}</td>
                    <td className="px-4 py-3 font-medium text-white">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{r.email || <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{r.phone || <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{r.city || <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3">
                      <Badge status={r.validation_status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      {r.is_duplicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-mono">
                          <Copy className="w-3 h-3" />
                          <span>{r.duplicate_group_id?.slice(0, 8)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.latest_review ? (
                        <Badge status={r.latest_review.review_status} size="sm" />
                      ) : (
                        <span className="text-slate-600 text-[11px]">Unreviewed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-400 hover:text-white bg-slate-800 hover:bg-brand-600 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No records matched the selected query or filters.
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
            <span className="text-slate-400">
              Page <strong className="text-white">{data.page}</strong> of{' '}
              <strong className="text-white">{data.total_pages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Record Inspection</span>
                  <Badge status={selectedRecord.validation_status} size="sm" />
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedRecord.record_id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Identity Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Full Name</span>
                  <div className="text-white font-medium mt-0.5">{selectedRecord.full_name}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Normalized Name</span>
                  <div className="text-slate-300 font-mono mt-0.5">{selectedRecord.normalized_name}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Email</span>
                  <div className="text-slate-300 mt-0.5">{selectedRecord.email || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Phone</span>
                  <div className="text-slate-300 mt-0.5">{selectedRecord.phone || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">City</span>
                  <div className="text-slate-300 mt-0.5">{selectedRecord.city || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Creation Date</span>
                  <div className="text-slate-300 mt-0.5">{selectedRecord.date_created || '—'}</div>
                </div>
              </div>

              {/* Duplicate Details */}
              {selectedRecord.is_duplicate && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300">
                  <strong>Duplicate Cluster:</strong> Group ID{' '}
                  <span className="font-mono">{selectedRecord.duplicate_group_id}</span>. This record shares
                  credentials with other profiles in the database.
                </div>
              )}

              {/* Rule Signals */}
              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Heuristic Rule Signals</h4>
                {selectedRecord.latest_analysis?.rule_signals &&
                selectedRecord.latest_analysis.rule_signals.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedRecord.latest_analysis.rule_signals.map((s, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between"
                      >
                        <div>
                          <div className="font-medium text-white">{s.rule_name}</div>
                          <div className="text-slate-400 mt-0.5">{s.description}</div>
                        </div>
                        <Badge status={s.severity} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    No validation rules violated.
                  </div>
                )}
              </div>

              {/* Review History */}
              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Review Status &amp; Notes</h4>
                {selectedRecord.latest_review ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge status={selectedRecord.latest_review.review_status} size="sm" />
                      <span className="text-slate-500 text-[10px]">
                        {new Date(selectedRecord.latest_review.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 pt-1">
                      {selectedRecord.latest_review.reviewer_notes || 'No reviewer notes provided.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-500">
                    This record has not undergone manual review.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
