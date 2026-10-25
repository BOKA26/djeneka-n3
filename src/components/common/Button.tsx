import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'outline' | 'ghost' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Accessibility: buttons have min-h-[44px]
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const sizeClasses = {
      sm: 'text-xs min-h-[44px] px-3.5 py-2 gap-1.5',
      md: 'text-sm min-h-[44px] px-4 py-2.5 gap-2',
      lg: 'text-base min-h-[48px] px-6 py-3.5 gap-2.5 font-semibold',
    }[size];

    const variantClasses = {
      primary:
        'bg-[#1B2A6B] text-white hover:bg-[#131E4D] focus:ring-[#1B2A6B] shadow-sm shadow-[#1B2A6B]/20',
      danger:
        'bg-[#D62828] text-white hover:bg-[#B71C1C] focus:ring-[#D62828] shadow-md shadow-[#D62828]/25 font-semibold',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-300 border border-slate-200/80',
      outline:
        'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-100/70 focus:ring-slate-400',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100/80 focus:ring-slate-300',
      whatsapp:
        'bg-[#25D366] text-white hover:bg-[#20ba59] focus:ring-[#25D366] shadow-sm shadow-[#25D366]/20 font-semibold',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
