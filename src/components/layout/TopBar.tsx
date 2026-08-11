'use client';

import Image from 'next/image';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-surface lg:hidden shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 text-ink-secondary hover:text-ink cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <Image src="/assets/isotype-128.png" alt="Hippos" width={24} height={24} className="w-6 h-6" />
      <span className="ml-2 font-heading font-semibold text-ink">Hippos</span>
    </header>
  );
}
