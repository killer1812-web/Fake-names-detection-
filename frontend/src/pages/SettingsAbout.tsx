import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const SettingsAbout: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'offline', database: { connected: false }, model_manager: { trained: false } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings &amp; System Information</h1>
          <p className="text-xs text-slate-400 mt-1">
            System health diagnostics, database architecture, model status, and research ethics guidelines.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ping Systems</span>
        </button>
      </div>

      {/* System Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Backend Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" />
              FastAPI Backend
            </span>
            <Badge status={health?.status === 'healthy' ? 'VALID' : 'FAILED'} size="sm" />
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-mono">FastAPI (Uvicorn)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Local Address:</span>
              <span className="font-mono">127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">API Version:</span>
              <span className="font-mono">{health?.version || '1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Database Engine
            </span>
            <Badge status={health?.database?.connected ? 'VALID' : 'FAILED'} size="sm" />
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Database Type:</span>
              <span className="font-mono uppercase">{health?.database?.url_type || 'SQLite 3'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ORM Layer:</span>
              <span className="font-mono">SQLAlchemy 2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MySQL 8 Support:</span>
              <span className="text-emerald-400 font-medium">Available via ENV</span>
            </div>
          </div>
        </div>

        {/* ML Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Machine Learning Core
            </span>
            <Badge status={health?.model_manager?.trained ? 'VALID' : 'PENDING'} size="sm" />
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Framework:</span>
              <span className="font-mono">Scikit-Learn</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Version:</span>
              <span className="font-mono">{health?.model_manager?.active_version || 'v20261020'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Anomaly Engine:</span>
              <span className="font-mono text-purple-400">Isolation Forest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ethical & Research Sandbox Governance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          Ethical &amp; Governance Statement
        </h2>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            {health?.ethical_disclaimer || (
              'RESEARCH & ANALYTICS DEMONSTRATION NOTICE: This platform utilizes synthetic data and heuristic/ML signals ' +
              'to assist human analysts in detecting artificial or malformed records. Unusual names or non-Western naming ' +
              'conventions are not proof of fraudulent activity. No protected attributes are ever used for scoring.'
            )}
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pt-1">
            <li>
              <strong>No Automated Fraud Accusation:</strong> Classifications are analytical signals recommending human review, never definitive accusations.
            </li>
            <li>
              <strong>Multicultural Name Protection:</strong> Non-English phonetics, hyphenations, single names, and apostrophes are explicitly preserved.
            </li>
            <li>
              <strong>Safe Synthetic Sandbox:</strong> Demonstrations use procedurally generated records from Faker. No real PII is collected or tracked.
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Documentation Links */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          Technical Documentation &amp; Portals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-brand-500/50 flex items-center justify-between group transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-white group-hover:text-brand-400 block">FastAPI Interactive Swagger UI</span>
              <span className="text-[11px] text-slate-500">Live API schema &amp; test harness</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
          </a>

          <a
            href="http://127.0.0.1:8000/redoc"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-brand-500/50 flex items-center justify-between group transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-white group-hover:text-brand-400 block">FastAPI ReDoc Portal</span>
              <span className="text-[11px] text-slate-500">Standard REST API reference specification</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
