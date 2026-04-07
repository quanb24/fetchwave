import React, { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<Props> = ({ open, onClose, title, subtitle, footer, children, maxWidth = 'max-w-3xl' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} max-h-[85vh] flex flex-col
          rounded-2xl bg-bg-elevated border border-bg-border-strong shadow-elevated
          animate-slide-up`}
      >
        {(title || subtitle) && (
          <div className="px-6 py-5 border-b border-bg-border">
            {title && <h2 className="text-base font-semibold text-fg truncate">{title}</h2>}
            {subtitle && <p className="text-xs text-fg-muted mt-1 truncate">{subtitle}</p>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-bg-border flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
};
