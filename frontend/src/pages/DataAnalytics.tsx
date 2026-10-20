import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  FileQuestion,
  Copy,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const COLORS = ['#0c87eb', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4'];

export const DataAnalytics: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEda = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load exploratory analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEda();
  }, []);

  if (loading && !data) {
    return <LoadingSkeleton rows={8} />;
  }

  const missingChartData = data?.missing_values
    ? Object.entries(data.missing_values).map(([field, pct]) => ({
        field: field.toUpperCase(),
        missing_pct: pct
      }))
    : [];

  const patternChartData = data?.special_pattern_distribution
    ? Object.entries(data.special_pattern_distribution).map(([pat, count]) => ({
        pattern: pat.replace(/_/g, ' '),
        count
      }))
    : [];

  const validationChartData = data?.validation_failures
    ? Object.entries(data.validation_failures).map(([status, count]) => ({
        status,
        count
      }))
    : [];

  const labelPieData = data?.label_distribution
    ? Object.entries(data.label_distribution)
        .filter(([_, count]) => (count as number) > 0)
        .map(([lbl, count]) => ({
          name: lbl,
          value: count
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Exploratory Data Analytics (EDA)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical distributions, quality metrics before &amp; after standardization, and attribute pattern analysis.
          </p>
        </div>
        <button
          onClick={fetchEda}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Ethics & Name Diversity Banner */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs leading-relaxed text-slate-300">
          <strong className="text-brand-300 font-semibold block mb-0.5">Statistical &amp; Ethical Interpretation Note</strong>
          Name lengths, word counts, and phonetic patterns naturally vary across cultures, nationalities, and languages.
          A short name (e.g., Bo Li) or a long patronymic (e.g., Jean-Baptiste de la Salle) is normal cultural diversity,
          never proof of fraud. These charts analyze formatting health, not human legitimacy.
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Analyzed Records</span>
          <div className="text-2xl font-bold text-white mt-1">{data?.total_records?.toLocaleString() || 0}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Stored across active datasets</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Duplicate Records Detected</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {data?.duplicates?.duplicate_records_count?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {data?.duplicates?.duplicate_groups || 0} distinct clusters ({data?.duplicates?.duplicate_percentage || 0}%)
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Post-Cleaning Pass Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {data?.quality_before_after?.pass_rate_percentage || 0}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {data?.quality_before_after?.clean_standardized_records || 0} completely clean profiles
          </span>
        </div>
      </div>

      {/* Grid of Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Name Length Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Full Name Length Distribution</h2>
            <span className="text-[11px] text-slate-400">Character count ranges</span>
          </div>
          <p className="text-xs text-slate-400">
            Shows character count spread. Real human names span from 3 to 40+ characters.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.name_length_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#0c87eb" radius={[4, 4, 0, 0]} name="Records" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missing Values Percentage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Missing-Field Incompleteness Rate (%)</h2>
            <span className="text-[11px] text-slate-400">Null / Empty fields</span>
          </div>
          <p className="text-xs text-slate-400">
            Percentage of identity records missing contact channels (email, phone, or location).
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="field" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="missing_pct" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Missing %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pattern Anomaly Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Special Character &amp; Digit Patterns</h2>
            <span className="text-[11px] text-slate-400">Formatting signals</span>
          </div>
          <p className="text-xs text-slate-400">
            Frequency of numbers, special symbols, whitespace anomalies, and token counts in names.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="pattern" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Synthetic Training Label Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Synthetic Label Balance</h2>
            <span className="text-[11px] text-slate-400">Ground Truth Split</span>
          </div>
          <p className="text-xs text-slate-400">
            Ratio of normal synthetic identities (0) to artificial review targets (1).
          </p>
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {labelPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={labelPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {labelPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No labeled training data logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
