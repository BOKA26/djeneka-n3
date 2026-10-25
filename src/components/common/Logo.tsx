import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  withLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md', withLink = true }) => {
  const isLight = variant === 'light';

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  }[size];

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Stylized Logo: Car silhouette + Cog gear + Wrench */}
      <div className={`relative flex items-center justify-center rounded-xl p-2 transition-transform group-hover:scale-105 shadow-sm ${
        isLight ? 'bg-white/10 text-white border border-white/20' : 'bg-[#1B2A6B] text-white shadow-[#1B2A6B]/20'
      }`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses.icon} shrink-0`}
        >
          {/* Gear in background */}
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.4" />
          
          {/* Car profile */}
          <path
            d="M8 28L14 18H32L39 28H42C43.1 28 44 28.9 44 30V33H4V30C4 28.9 4.9 28 6 28H8Z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Wheels */}
          <circle cx="14" cy="33" r="4.5" fill="#D62828" stroke="currentColor" strokeWidth="2" />
          <circle cx="34" cy="33" r="4.5" fill="#D62828" stroke="currentColor" strokeWidth="2" />
          <circle cx="14" cy="33" r="1.5" fill="white" />
          <circle cx="34" cy="33" r="1.5" fill="white" />
          
          {/* Wrench overlay angled across */}
          <path
            d="M32 10L36 14L39 11L41 13L38 16L40 18L36 22L34 20L20 34L16 30L30 16L28 14L32 10Z"
            fill="#D62828"
          />
          <circle cx="18" cy="32" r="1" fill="white" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-heading font-extrabold tracking-tight uppercase leading-none ${sizeClasses.text} ${
            isLight ? 'text-white' : 'text-[#1B2A6B]'
          }`}
        >
          Officina <span className="text-[#D62828]">Djeneka</span>
        </span>
        <span
          className={`font-semibold tracking-wider uppercase mt-0.5 ${sizeClasses.sub} ${
            isLight ? 'text-blue-200' : 'text-slate-500'
          }`}
        >
          Garage Moderne • Bingerville
        </span>
      </div>
    </div>
  );

  if (withLink) {
    return <Link to="/" aria-label="Officina Djeneka - Retour à l'accueil">{content}</Link>;
  }

  return content;
};
