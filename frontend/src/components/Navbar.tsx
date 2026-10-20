import React, { useState, useEffect } from 'react';
import { Menu, ExternalLink, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [modelTrained, setModelTrained] = useState<boolean | null>(null);

  const checkStatus = async () => {
    try {
      const data = await api.getHealth();
      setHealthy(data.status === 'healthy');
      setModelTrained(data.model_manager?.trained || false);
    } catch {
      setHealthy(false);
      setModelTrained(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Environment:</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            Windows / Local
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* API Health Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              healthy === true
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                : healthy === false
                ? 'bg-rose-500'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {healthy === true ? 'Backend Online' : healthy === false ? 'API Offline' : 'Connecting...'}
          </span>
        </div>

        {/* Model Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-slate-300 font-medium">
            {modelTrained ? 'ML Models Active' : 'Rules Only'}
          </span>
        </div>

        {/* Swagger Docs Link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <span>Swagger API</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
};
