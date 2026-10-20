import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Copy,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RefreshCw,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, DashboardTrends } from '../types';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const COLORS = ['#0c87eb', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];

export const OverviewDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(30)
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !summary) {
    return <LoadingSkeleton rows={8} />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to Load Dashboard"
        description={error}
        actionText="Retry Connection"
        onAction={fetchData}
      />
    );
  }

  const reviewPieData = trends?.review_status_distribution
    ? Object.entries(trends.review_status_distribution)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({ name: status, value: count }))
    : [];

  const qualityBarData = trends?.data_quality_breakdown
    ? Object.entries(trends.data_quality_breakdown).map(([status, count]) => ({
        status,
        records: count
      }))
    : [];

  const predictionPieData = trends?.model_prediction_distribution
    ? Object.entries(trends.model_prediction_distribution)
        .filter(([_, count]) => count > 0)
        .map(([pred, count]) => ({ name: pred, value: count }))
    : [];

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heuristic &amp; machine learning identity analytics and quality surveillance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={summary?.total_records.toLocaleString() || '0'}
          subtitle={`Analyzed: ${summary?.records_analyzed.toLocaleString() || '0'}`}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Flagged for Review"
          value={summary?.records_flagged_for_review.toLocaleString() || '0'}
          subtitle="Triggered validation rules or ML risk"
          icon={AlertTriangle}
          color="amber"
          badge={summary?.records_flagged_for_review ? 'Action Req' : undefined}
        />
        <StatCard
          title="Duplicate Groups"
          value={summary?.duplicate_record_groups.toLocaleString() || '0'}
          subtitle="Identified clusters sharing credentials"
          icon={Copy}
          color="purple"
        />
        <StatCard
          title="Quality Pass Rate"
          value={`${summary?.quality_pass_rate || 0}%`}
          subtitle={`Awaiting review: ${summary?.records_awaiting_review || 0}`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Missing or Invalid Fields</span>
            <div className="text-lg font-semibold text-white mt-0.5">{summary?.missing_or_invalid_fields || 0}</div>
          </div>
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Ingestion Jobs</span>
            <div className="text-lg font-semibold text-white mt-0.5">{summary?.total_analysis_jobs || 0}</div>
          </div>
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Last Analysis Run</span>
            <div className="text-xs font-mono text-slate-300 mt-1">
              {summary?.most_recent_analysis_date
                ? new Date(summary.most_recent_analysis_date).toLocaleString()
                : 'None yet'}
            </div>
          </div>
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols wide) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Record Analysis Trend Over Time</h2>
              <p className="text-xs text-slate-400">Time-series distribution of analyzed identity records</p>
            </div>
          </div>
          {trends?.trends && trends.trends.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.trends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c87eb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0c87eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="total_records" stroke="#0c87eb" fillOpacity={1} fill="url(#colorTotal)" name="Total Records" />
                  <Area type="monotone" dataKey="flagged_records" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFlagged)" name="Flagged for Review" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No trend history available. Upload records to populate charts.
            </div>
          )}
        </div>

        {/* Review Status Donut Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-white">Review Status Distribution</h2>
          <p className="text-xs text-slate-400 mb-2">Breakdown of human manual reviews</p>
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {reviewPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={reviewPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {reviewPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center">No reviews in queue yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quality Breakdown & Prediction Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality Issues */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white">Data Quality & Validation Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Frequency of validation statuses across all records</p>
          {qualityBarData.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="status" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="records" fill="#0c87eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              No validation metrics available.
            </div>
          )}
        </div>

        {/* Model Prediction Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white">Model Prediction Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">ML and heuristic classification breakdown</p>
          {predictionPieData.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictionPieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              No model prediction logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
