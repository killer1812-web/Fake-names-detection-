import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [powerBiLoading, setPowerBiLoading] = useState(false);
  const [powerBiResult, setPowerBiResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePowerBi = async () => {
    setPowerBiLoading(true);
    setError(null);
    try {
      const res = await api.generatePowerBiCsvs();
      setPowerBiResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate Power BI CSV files.');
    } finally {
      setPowerBiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Reports &amp; Power BI Integration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Export verified analytical audit reports in CSV and JSON formats, or synchronize Microsoft Power BI datasets.
        </p>
      </div>

      {/* Main Downloads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comprehensive Audit Export */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Comprehensive Audit Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">Direct raw download for external reporting</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Exports all current database records, data quality metrics, duplicate clusters, model performance scores, and
            manual review summaries with timestamped metadata.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={api.exportReportUrl('csv')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </a>

            <a
              href={api.exportReportUrl('json')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Download JSON Audit</span>
            </a>
          </div>
        </div>

        {/* Power BI Desktop Synchronization */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Power BI Data Sync</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pre-structured dimensional CSV schemas</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Generates 6 normalized CSV files configured specifically for Power BI Desktop data modeling and KPI dashboard creation.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGeneratePowerBi}
              disabled={powerBiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              {powerBiLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Generating Power BI CSVs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Power BI CSV Bundle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Power BI Generated Files Summary */}
      {powerBiResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">{powerBiResult.message}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {Object.entries(powerBiResult.files || {}).map(([key, path]: [string, any]) => (
              <div key={key} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px]">
                <div className="text-slate-300 font-semibold">{key}.csv</div>
                <div className="text-slate-500 truncate mt-0.5" title={path}>
                  {path}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Power BI Quick Setup Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white">Power BI Desktop Setup Instructions</h2>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
          <li>
            Open <strong>Microsoft Power BI Desktop</strong> on your computer.
          </li>
          <li>
            Click <strong>Get Data &gt; Text/CSV</strong> and navigate to the project's <code className="text-brand-300 font-mono">reports/</code> directory.
          </li>
          <li>
            Select and import:
            <ul className="list-disc list-inside ml-4 mt-1 text-slate-400 space-y-0.5">
              <li><code className="text-slate-300 font-mono">dashboard_summary.csv</code> (KPI metrics card feeds)</li>
              <li><code className="text-slate-300 font-mono">data_quality_metrics.csv</code> (Bar charts &amp; pass rates)</li>
              <li><code className="text-slate-300 font-mono">duplicate_analysis.csv</code> (Cluster tables)</li>
              <li><code className="text-slate-300 font-mono">record_analysis_results.csv</code> (Individual record details &amp; risk flags)</li>
              <li><code className="text-slate-300 font-mono">model_metrics.csv</code> (Confusion matrices &amp; F1 scores)</li>
              <li><code className="text-slate-300 font-mono">review_summary.csv</code> (Adjudication statuses)</li>
            </ul>
          </li>
          <li>
            In the <strong>Model View</strong>, establish relationships on <code className="text-brand-300 font-mono">record_id</code> between tables.
          </li>
          <li>
            Refer to <code className="text-brand-300 font-mono">docs/POWER_BI_SETUP.md</code> for pre-configured DAX measures and visualization templates.
          </li>
        </ol>
      </div>
    </div>
  );
};
