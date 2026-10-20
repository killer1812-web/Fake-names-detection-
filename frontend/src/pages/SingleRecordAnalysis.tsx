import React, { useState } from 'react';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Cpu,
  ShieldAlert,
  Save,
  Sparkles,
  Info,
  CornerDownRight
} from 'lucide-react';
import { api } from '../services/api';
import { SingleRecordAnalysisResult } from '../types';
import { Badge } from '../components/Badge';

export const SingleRecordAnalysis: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [dateCreated, setDateCreated] = useState('');
  const [saveToDb, setSaveToDb] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SingleRecordAnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter a full name to analyze.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.analyzeSingleRecord({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        date_created: dateCreated || undefined,
        save_to_database: saveToDb,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type: 'valid' | 'placeholder' | 'digit' | 'phone') => {
    if (type === 'valid') {
      setFullName('Dr. Amara Okafor');
      setEmail('amara.okafor@gmail.com');
      setPhone('+1 (555) 234-5678');
      setCity('Atlanta');
      setDateCreated('2026-03-15');
    } else if (type === 'placeholder') {
      setFullName('Test User');
      setEmail('testuser@example.com');
      setPhone('555-0100');
      setCity('Metropolis');
      setDateCreated('2026-05-10');
    } else if (type === 'digit') {
      setFullName('John99 Smith#');
      setEmail('bad-email-format');
      setPhone('000-000-0000');
      setCity('New York');
      setDateCreated('2026-06-01');
    } else if (type === 'phone') {
      setFullName('Robert J. Miller');
      setEmail('robert.miller@mailinator.com');
      setPhone('1234567890');
      setCity('Chicago');
      setDateCreated('2026-07-20');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Single Record Analysis</h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate an individual identity record through multi-layered heuristics, duplicate scanning, and machine learning models.
        </p>
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Test Presets:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('valid')}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium transition-colors"
        >
          Plausible Identity
        </button>
        <button
          type="button"
          onClick={() => loadPreset('placeholder')}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-medium transition-colors"
        >
          Placeholder Name
        </button>
        <button
          type="button"
          onClick={() => loadPreset('digit')}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-medium transition-colors"
        >
          Digits & Symbols in Name
        </button>
        <button
          type="button"
          onClick={() => loadPreset('phone')}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 font-medium transition-colors"
        >
          Sequential Phone & Disposable Email
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-400" />
            Identity Attributes
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Elena Rostova or Test User"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0192 or 0000000000"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Creation Date</label>
                <input
                  type="date"
                  value={dateCreated}
                  onChange={(e) => setDateCreated(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-brand-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-300 font-medium">Save Record & Analysis to Database</span>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Record...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Run Complete Analysis</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Header Status Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <Badge status={result.validation_status} />
                    {result.persisted && result.record_id && (
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {result.record_id} (Persisted)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">Rule &amp; ML Evaluation Complete</span>
                </div>

                {/* Suggested Action Alert */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                  <CornerDownRight className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Recommendation</span>
                    <p className="text-xs text-slate-300 mt-0.5">{result.suggested_next_action}</p>
                  </div>
                </div>
              </div>

              {/* Data Quality Signals Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Rule-Based Validation Signals ({result.data_quality_signals.length})
                </h3>

                {result.data_quality_signals.length > 0 ? (
                  <div className="space-y-2">
                    {result.data_quality_signals.map((sig, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{sig.rule_name}</span>
                            <span className="text-[10px] font-mono text-slate-500">({sig.rule_id})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{sig.description}</p>
                          {sig.detected_value && (
                            <p className="text-[11px] font-mono text-slate-500 mt-1">
                              Detected: <span className="text-slate-300">{sig.detected_value}</span>
                            </p>
                          )}
                        </div>
                        <Badge status={sig.severity} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No rule violations or data quality anomalies detected.</span>
                  </div>
                )}
              </div>

              {/* Duplicate Matching */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-purple-400" />
                  Database Duplicate Matches ({result.duplicate_matches.length})
                </h3>

                {result.duplicate_matches.length > 0 ? (
                  <div className="space-y-2">
                    {result.duplicate_matches.map((match, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{match.full_name}</span>
                            <span className="text-xs font-mono text-purple-400">
                              {match.matched_record_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{match.note}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-white">
                            {(match.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block">Match Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No duplicate name, email, or phone collisions found in the database.
                  </p>
                )}
              </div>

              {/* Machine Learning Model Output */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-400" />
                  Machine Learning Model Inference
                </h3>

                {result.model_output ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Prediction</span>
                        <div className="mt-1">
                          <Badge status={result.model_output.prediction} size="sm" />
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Risk Probability
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          {result.model_output.probability !== null && result.model_output.probability !== undefined
                            ? `${(result.model_output.probability * 100).toFixed(1)}%`
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Anomaly Detector
                        </span>
                        <div className="mt-1">
                          <Badge
                            status={result.model_output.anomaly_detected ? 'ANOMALY_DETECTED' : 'NORMAL'}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      {result.model_output.disclaimer}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
                    No trained machine learning model is currently active. Analytical signals are determined solely
                    by deterministic data quality and pattern rules.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <UserCheck className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Ready for Record Analysis</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Enter an identity record on the left or select a preset above to inspect rule-based signals and ML evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
