import React from 'react';

interface FoxLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  showSlogan?: boolean;
  monochrome?: boolean;
  className?: string;
}

export default function FoxLogo({
  size = 'md',
  iconOnly = false,
  showSlogan = false,
  monochrome = false,
  className = '',
}: FoxLogoProps) {
  // Dimensions map
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-base', slogan: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', slogan: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', slogan: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-3xl', slogan: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Emerald Lotus Flower Emblem */}
      <div
        className={`relative ${currentSize.icon} shrink-0 rounded-2xl flex items-center justify-center p-1 transition-transform duration-300 hover:scale-105 ${
          monochrome
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 p-1.5'
            : 'bg-emerald-50/90 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-neutral-900 dark:to-black border border-emerald-200/90 dark:border-emerald-500/30 ring-1 ring-emerald-500/10 dark:ring-emerald-500/20 shadow-sm dark:shadow-emerald-500/15'
        }`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Rich Emerald & Mint Gradients */}
            <linearGradient id="emeraldGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="30%" stopColor="#34D399" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="emeraldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>

            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Emerald Lotus Blossom Vector Art */}
          <g
            stroke={monochrome ? 'currentColor' : 'url(#emeraldGradientMain)'}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={monochrome ? undefined : 'url(#emeraldGlow)'}
          >
            {/* Central Top Petal */}
            <path d="M60 14 C56 32, 48 48, 60 74 C72 48, 64 32, 60 14 Z" />

            {/* Inner Left Petal */}
            <path d="M60 74 C50 54, 34 38, 44 26 C53 38, 56 52, 60 74 Z" />
            {/* Inner Right Petal */}
            <path d="M60 74 C70 54, 86 38, 76 26 C67 38, 64 52, 60 74 Z" />

            {/* Middle Left Petal */}
            <path d="M60 76 C46 62, 22 46, 28 34 C40 44, 48 58, 60 76 Z" />
            {/* Middle Right Petal */}
            <path d="M60 76 C74 62, 98 46, 92 34 C80 44, 72 58, 60 76 Z" />

            {/* Outer Lower Left Petal */}
            <path d="M60 78 C42 70, 16 62, 18 52 C32 54, 46 68, 60 78 Z" />
            {/* Outer Lower Right Petal */}
            <path d="M60 78 C78 70, 104 62, 102 52 C88 54, 74 68, 60 78 Z" />

            {/* Horizontal Bottom Base Petals */}
            <path d="M60 80 C40 78, 24 74, 26 66 C42 66, 52 74, 60 80 Z" />
            <path d="M60 80 C80 78, 96 74, 94 66 C78 66, 68 74, 60 80 Z" />

            {/* Lotus Seed/Pod Base Core */}
            <path
              d="M56 82 C56 85, 64 85, 64 82 C64 80, 56 80, 56 82 Z"
              fill={monochrome ? 'currentColor' : 'url(#emeraldAccent)'}
              strokeWidth="1.5"
            />

            {/* Side Ornaments / Accent Sparks */}
            <path d="M12 70 L20 70" strokeWidth="1.5" opacity="0.8" />
            <path d="M100 70 L108 70" strokeWidth="1.5" opacity="0.8" />
            <polygon points="16,68 18,70 16,72 14,70" fill={monochrome ? 'currentColor' : 'url(#emeraldAccent)'} />
            <polygon points="104,68 106,70 104,72 102,70" fill={monochrome ? 'currentColor' : 'url(#emeraldAccent)'} />
          </g>
        </svg>
      </div>

      {/* Brand Luxury Typography */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className="font-serif tracking-normal font-extrabold text-slate-900 dark:text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              <span className={currentSize.text}>Fox </span>
              <span className={`${currentSize.text} text-emerald-500 dark:text-emerald-400 drop-shadow-sm`}>
                way
              </span>
            </span>
          </div>

          {/* French Slogan from the user's original brand identity */}
          <span
            className={`font-serif italic font-medium text-emerald-600/90 dark:text-emerald-400/80 tracking-wide mt-0.5 ${currentSize.slogan} ${
              showSlogan ? 'block' : 'hidden sm:block'
            }`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            L'inspiration n'a plus de fin
          </span>
        </div>
      )}
    </div>
  );
}
