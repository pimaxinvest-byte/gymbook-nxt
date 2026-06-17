'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const NAV = [
  {
    section: 'Principal',
    items: [
      { href: '/trainer', label: 'Dashboard', icon: '▪' },
      { href: '/trainer/clients', label: 'Clientes', icon: '◈', badge: '—' },
      { href: '/trainer/calendar', label: 'Calendario', icon: '◫' },
    ],
  },
  {
    section: 'Programa',
    items: [
      { href: '/trainer/training', label: 'Entrenamiento', icon: '◉' },
      { href: '/trainer/nutrition', label: 'Nutrición', icon: '◈' },
      { href: '/trainer/progress', label: 'Progreso', icon: '◧' },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { href: '/trainer/credits', label: 'Créditos', icon: '◆' },
      { href: '/trainer/messages', label: 'Mensajes', icon: '◫' },
    ],
  },
]

const CLIENT_NAV = [
  {
    section: 'Principal',
    items: [
      { href: '/client', label: 'Dashboard', icon: '▪' },
      { href: '/client/training', label: 'Entrenamiento', icon: '◉' },
      { href: '/client/progress', label: 'Progreso', icon: '◎' },
      { href: '/client/nutrition', label: 'Nutrición', icon: '◈' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { href: '/client/messages', label: 'Mensajes', icon: '◫' },
    ],
  },
]

function SidebarContent({
  activeHref,
  userName,
  userEmail,
  userInitial,
  nav,
  role,
}: {
  activeHref: string
  userName: string
  userEmail: string
  userInitial: string
  nav: typeof NAV
  role: string
}) {
  function isActive(href: string) {
    if (href === '/trainer') return activeHref === '/trainer'
    if (href === '/client') return activeHref === '/client'
    return activeHref === href || activeHref.startsWith(href + '/')
  }

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <span
          style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '8px solid #EAB308',
            display: 'inline-block',
            marginBottom: '1px',
          }}
        />
        <span className="text-sm font-bold text-text tracking-tight">
          Gym<span className="text-primary">Book</span>
          <span className="text-text-muted font-normal ml-1 text-xs">NXT</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.section}>
            <p className="nav-section-label">{section.section}</p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={isActive(item.href) ? 'nav-item-active' : 'nav-item'}
              >
                <span className="text-[10px] text-text-muted font-mono w-3.5 text-center flex-shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono text-text-muted opacity-40">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border">
        {/* System status pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-xs text-text-muted font-mono flex-1 truncate">
            sys·online
          </span>
          <span className="text-[10px] text-text-muted opacity-50 font-mono">v0.1</span>
        </div>
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-2 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30
                          flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text truncate">{userName}</p>
            <p className="text-[10px] text-text-muted truncate">{userEmail}</p>
          </div>
          <span className="text-text-muted text-xs opacity-40">⋯</span>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const userName  = session?.user?.name  ?? 'Usuario'
  const userEmail = session?.user?.email ?? ''
  const userInitial = userName.charAt(0).toUpperCase()
  const role = (session?.user as any)?.role ?? 'TRAINER'
  const activeNav = role === 'CLIENT' ? CLIENT_NAV : NAV

  return (
    <div className="min-h-screen flex bg-bg">
      {/* ── Desktop Sidebar ───────────────── */}
      <aside className="w-56 hidden lg:flex flex-col bg-surface border-r border-border flex-shrink-0">
        <SidebarContent
          activeHref={pathname}
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
          nav={activeNav}
          role={role}
        />
      </aside>

      {/* ── Mobile Overlay ────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-56 bg-surface border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              activeHref={pathname}
              userName={userName}
              userEmail={userEmail}
              userInitial={userInitial}
              nav={activeNav}
              role={role}
            />
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-14 border-b border-border
                           flex items-center px-4 gap-4 bg-surface sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-icon text-text-muted hover:text-text"
            aria-label="Abrir menú"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="1.5" rx=".75" fill="currentColor"/>
              <rect x="2" y="7.25" width="12" height="1.5" rx=".75" fill="currentColor"/>
              <rect x="2" y="10.5" width="12" height="1.5" rx=".75" fill="currentColor"/>
            </svg>
          </button>
          <span className="text-sm font-bold text-text">
            Gym<span className="text-primary">Book</span>
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
