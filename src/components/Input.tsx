import React from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & { size?: 'md' | 'lg' };

export const Input = React.forwardRef<HTMLInputElement, Props>(({ className = '', size = 'md', ...rest }, ref) => (
  <input
    ref={ref}
    className={`
      w-full bg-bg-soft border border-bg-border rounded-lg
      ${size === 'lg' ? 'h-12 px-4 text-sm' : 'h-9 px-3 text-sm'}
      text-fg placeholder:text-fg-dim
      transition
      focus:outline-none focus:border-accent focus:shadow-focus
      disabled:opacity-50
      ${className}
    `}
    {...rest}
  />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`
        w-full h-9 px-3 text-sm rounded-lg
        bg-bg-soft border border-bg-border text-fg
        focus:outline-none focus:border-accent focus:shadow-focus
        transition appearance-none pr-8
        bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path fill='%238a91a3' d='M2 4l4 4 4-4z'/></svg>")]
        bg-no-repeat bg-[right_0.75rem_center]
        ${className}
      `}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
