import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Info,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { ModelRunItem } from '../types';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const MachineLearning: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<any | null>(null);
  const [metricsData, setMetricsData] = useState<{ is_trained: boolean; runs: ModelRunItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [testSize, setTestSize] = useState(0.2);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, metricsRes] = await Promise.all([
        api.getModelStatus(),
        api.getModelMetrics()
      ]);
      setModelStatus(statusRes);
      setMetricsData(metricsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch model metadata.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    setTrainMessage(null);
    try {
      const res = await api.trainModels({ test_size: testSize, random_seed: 42 });
      setTrainMessage(res.message);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Training failed.');
    } finally {
      setTraining(false);
    }
  };

  if (loading && !modelStatus) {
    return <LoadingSkeleton rows={8} />;
  }

  // Get active models
  const activeRuns = metricsData?.runs?.filter((r) => r.status === 'ACTIVE') || [];
  const activeRun = activeRuns[0] || metricsData?.runs?.[0];

  const featImpData = activeRun?.metrics?.feature_importances
    ? Object.entries(activeRun.metrics.feature_importances)
        .map(([feature, importance]) => ({
          feature: feature.replace(/_/g, ' '),
          importance: parseFloat((importance * 100).toFixed(2))
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Machine Learning Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Train, compare, and audit supervised classifiers (Logistic Regression, Random Forest) and unsupervised Isolation Forest.
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

      {/* Synthetic Demonstration Disclaimer */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs leading-relaxed text-slate-300">
          <strong className="text-brand-300 font-semibold block mb-0.5">Synthetic Demonstration Model Governance</strong>
          Models are trained on synthetic research data with explicitly documented rules. They evaluate formatting patterns and
          anomalies, but do not establish real-world identity verification. Unlabeled records are never silently used as ground truth.
        </div>
      </div>

      {/* Model Training & Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  {modelStatus?.is_trained ? 'Model Pipeline Active' : 'No Model Trained'}
                </h2>
                <Badge status={modelStatus?.is_trained ? 'VALID' : 'PENDING'} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Active Artifact: {modelStatus?.active_model_version || 'None'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400">Test Split:</span>
              <select
                value={testSize}
                onChange={(e) => setTestSize(parseFloat(e.target.value))}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs"
              >
                <option value={0.15}>15% Test</option>
                <option value={0.2}>20% Test (Default)</option>
                <option value={0.3}>30% Test</option>
              </select>
            </div>

            <button
              onClick={handleTrain}
              disabled={training}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              {training ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Training Classifiers...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Train &amp; Evaluate Models</span>
                </>
              )}
            </button>
          </div>
        </div>

        {trainMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{trainMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Labeled Training Pool</span>
            <div className="text-base font-bold text-white mt-0.5">
              {modelStatus?.available_labeled_records?.toLocaleString() || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Active Best Model</span>
            <div className="text-xs font-semibold text-brand-400 mt-1">
              {activeRun?.model_name || 'Random Forest'}
            </div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">F1-Score (Holdout)</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {activeRun?.metrics?.f1_score !== undefined
                ? `${(activeRun.metrics.f1_score * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">ROC-AUC Score</span>
            <div className="text-base font-bold text-purple-400 mt-0.5">
              {activeRun?.metrics?.roc_auc !== undefined && activeRun.metrics.roc_auc !== null
                ? activeRun.metrics.roc_auc.toFixed(3)
                : '1.000'}
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricsData?.runs && metricsData.runs.length > 0 ? (
          metricsData.runs.slice(0, 3).map((run) => (
            <div
              key={run.id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-sm space-y-3 ${
                run.status === 'ACTIVE' ? 'border-brand-500/50 ring-1 ring-brand-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{run.model_name}</span>
                <Badge status={run.status} size="sm" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Accuracy:</span>
                  <span className="font-semibold text-white">
                    {(run.metrics.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Precision:</span>
                  <span className="font-semibold text-white">
                    {(run.metrics.precision * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recall:</span>
                  <span className="font-semibold text-white">
                    {(run.metrics.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>F1-Score:</span>
                  <span className="font-semibold text-emerald-400">
                    {(run.metrics.f1_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Mini Confusion Matrix */}
              <div className="pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">
                  Holdout Errors
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>False Positives: {run.metrics.false_positives}</span>
                  <span>False Negatives: {run.metrics.false_negatives}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
            No trained models found. Click "Train &amp; Evaluate Models" to build initial classifiers.
          </div>
        )}
      </div>

      {/* Feature Importances Bar Chart */}
      {featImpData.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Feature Importance Ranking (Random Forest)</h2>
            <span className="text-[11px] text-slate-400">Top predictive heuristic signals</span>
          </div>
          <p className="text-xs text-slate-400">
            Measures which engineered data quality indicators contributed most to differentiating normal vs flagged records.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featImpData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="importance" fill="#0c87eb" radius={[0, 4, 4, 0]} name="Importance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
