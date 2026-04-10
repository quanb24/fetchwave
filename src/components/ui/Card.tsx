import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export const Card: React.FC<Props> = ({ interactive, elevated, className = '', ...rest }) => (
  <div
    className={`
      rounded-xl bg-bg-card border border-bg-border
      ring-1 ring-bg-border-inner
      ${elevated ? 'shadow-elevated' : 'shadow-card'}
      ${interactive ? 'transition-all duration-150 ease-out hover:border-bg-border-strong hover:bg-bg-elevated hover:shadow-elevated cursor-pointer' : ''}
      ${className}
    `}
    {...rest}
  />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div className={`px-6 py-5 border-b border-bg-border ${className}`} {...rest} />
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div className={`px-6 py-5 ${className}`} {...rest} />
);
