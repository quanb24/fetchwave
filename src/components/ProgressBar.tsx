import React from 'react';

interface Props {
  value: number;
  status?: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  indeterminate?: boolean;
}

const colors: Record<NonNullable<Props['status']>, string> = {
  queued:    'bg-fg-faint',
  running:   'bg-gradient-to-r from-accent to-accent-hover',
  paused:    'bg-warn',
  completed: 'bg-success',
  failed:    'bg-danger',
  cancelled: 'bg-fg-faint',
};

export const ProgressBar: React.FC<Props> = ({ value, status = 'running', indeterminate }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-1.5 w-full rounded-full bg-bg-soft overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 ${colors[status]} transition-[width] duration-500 ease-out rounded-full`}
        style={{ width: indeterminate ? '40%' : `${v}%` }}
      />
      {indeterminate && (
        <div className="absolute inset-y-0 w-full animate-shimmer bg-shimmer" />
      )}
    </div>
  );
};
