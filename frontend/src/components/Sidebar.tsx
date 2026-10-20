import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  UploadCloud,
  Database,
  BarChart3,
  Cpu,
  ClipboardList,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Info
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/single-analysis', label: 'Single Record Analysis', icon: UserCheck },
  { path: '/upload', label: 'Bulk CSV Upload', icon: UploadCloud },
  { path: '/records', label: 'Records Explorer', icon: Database },
  { path: '/analytics', label: 'Data Analytics & EDA', icon: BarChart3 },
  { path: '/ml', label: 'Machine Learning', icon: Cpu },
  { path: '/reviews', label: 'Review Queue', icon: ClipboardList },
  { path: '/reports', label: 'Reports & Power BI', icon: FileSpreadsheet },
  { path: '/settings', label: 'Settings & About', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-sm tracking-wide text-white block">IdentityIQ</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
              Synthetic Analytics
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Ethics & Research Disclaimer notice */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-400 leading-snug">
              <strong className="text-slate-300 font-medium">Research Sandbox:</strong> Analytical signals assist human review. Unusual names are not fraud.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
