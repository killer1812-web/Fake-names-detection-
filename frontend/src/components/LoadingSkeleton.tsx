import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-4 bg-slate-800 rounded w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-800/60 rounded"></div>
        ))}
      </div>
    </div>
  );
};
