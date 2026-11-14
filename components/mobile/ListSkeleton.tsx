import React from 'react';

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-28 rounded-shell bg-terreta-border/50 animate-pulse" />
    ))}
  </div>
);
