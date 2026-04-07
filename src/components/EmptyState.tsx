import React from 'react';

interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-24 animate-fade-in">
    <div className="relative h-16 w-16 mb-6">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bg-card to-bg-elevated border border-bg-border shadow-card" />
      <div className="absolute inset-0 flex items-center justify-center text-fg-muted">
        {icon ?? '∅'}
      </div>
    </div>
    <h3 className="text-base font-semibold text-fg">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-[13px] text-fg-muted leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
