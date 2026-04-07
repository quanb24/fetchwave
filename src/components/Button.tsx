import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white shadow-sm border border-accent/40',
  secondary: 'bg-bg-elevated hover:bg-bg-card text-fg border border-bg-border hover:border-bg-border-strong',
  ghost: 'bg-transparent hover:bg-bg-elevated text-fg-muted hover:text-fg border border-transparent',
  danger: 'bg-danger hover:bg-danger/90 text-white border border-danger/40',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-sm rounded-xl',
};

export const Button: React.FC<Props> = ({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  disabled,
  children,
  ...rest
}) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 font-medium
      transition-all duration-150
      focus:outline-none focus-visible:shadow-focus
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
      ${variants[variant]} ${sizes[size]} ${className}
    `}
    disabled={disabled || loading}
    {...rest}
  >
    {loading && (
      <span className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
    )}
    {children}
  </button>
);
