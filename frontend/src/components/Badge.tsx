import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (norm === 'VALID' || norm === 'APPROVED' || norm === 'NORMAL' || norm === 'COMPLETED') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (norm === 'FLAGGED' || norm === 'REVIEW_RECOMMENDED' || norm === 'CONFIRMED_ISSUE') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (norm === 'INVALID_FORMAT' || norm === 'CRITICAL' || norm === 'HIGH' || norm === 'FAILED') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (norm === 'PENDING' || norm === 'PROCESSING') {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (norm === 'FALSE_POSITIVE' || norm === 'DISMISSED') {
    styles = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  } else if (norm === 'DUPLICATE' || norm === 'ANOMALY_DETECTED') {
    styles = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  } else if (norm === 'MEDIUM') {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  } else if (norm === 'LOW') {
    styles = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full tracking-wide transition-colors ${sizeClasses} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
