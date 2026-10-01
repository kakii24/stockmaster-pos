import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefixIcon, suffixText, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center">
              {prefixIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
              prefixIcon && 'pl-10',
              suffixText && 'pr-12',
              error && 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500',
              className
            )}
            {...props}
          />
          {suffixText && (
            <span className="absolute right-3 text-xs font-bold text-slate-500 pointer-events-none">
              {suffixText}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
