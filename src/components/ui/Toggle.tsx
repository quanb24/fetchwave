import React from 'react';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<Props> = ({ checked, onChange, label, description, disabled }) => (
  <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-200 ease-out
        ${checked ? 'bg-accent shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]' : 'bg-bg-border-strong'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:shadow-focus
        active:scale-[0.95]`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ease-out
          ${checked ? 'translate-x-[18px] shadow-md' : 'translate-x-0.5 shadow-sm'}`}
      />
    </button>
    {(label || description) && (
      <div className="min-w-0">
        {label && <div className="text-sm text-fg leading-tight">{label}</div>}
        {description && <div className="text-xs text-fg-muted mt-0.5 leading-snug">{description}</div>}
      </div>
    )}
  </label>
);
