import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    navy: 'bg-[#1B2A6B]/10 text-[#1B2A6B] border-[#1B2A6B]/20 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-[#D62828] border-rose-200 font-semibold',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    outline: 'bg-transparent border-slate-300 text-slate-600',
  }[variant];

  const dotColors = {
    default: 'bg-slate-400',
    navy: 'bg-[#1B2A6B]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-[#D62828]',
    info: 'bg-blue-500',
    outline: 'bg-slate-400',
  }[variant];

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantClasses} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      {children}
    </span>
  );
};
