import React from 'react';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<Props> = ({ title, description, action }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {description && <p className="text-xs text-fg-muted mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);
