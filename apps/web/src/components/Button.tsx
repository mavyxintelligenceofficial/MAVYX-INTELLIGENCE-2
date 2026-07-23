import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({ isLoading, children, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  );
}
