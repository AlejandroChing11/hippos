'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/patients', label: 'Pacientes', icon: 'users' },
  { href: '/calculator', label: 'Calculadora TMB', icon: 'calc' },
  { href: '/formula', label: 'Fórmula', icon: 'table' },
] as const;

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    document.cookie = 'hippos_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  }

  return (
    <aside className="flex flex-col h-full w-[260px] bg-surface border-r border-border">
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-heading font-bold text-ink tracking-tight">🦛 Hippos</h1>
        <p className="text-xs text-ink-tertiary mt-0.5">Planificación Dietaria</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={e => { e.preventDefault(); router.push(item.href); onClose?.(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sage-light text-sage'
                  : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: string }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {name === 'users' && (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
      {name === 'calc' && (
        <>
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" y2="18" />
          <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
        </>
      )}
      {name === 'table' && (
        <>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
        </>
      )}
    </svg>
  );
}
