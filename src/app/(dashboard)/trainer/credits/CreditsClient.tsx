'use client'

import { useState } from 'react'
import Link from 'next/link'
import CreatePackageForm from './CreatePackageForm'
import SellPackageForm from './SellPackageForm'

type Package = { id: string; name: string; totalCredits: number; price: number; creditType: string }
type Client  = { id: string; name: string; balance: number }

export default function CreditsClient({
  clients,
  packages,
  stats,
}: {
  clients: Client[]
  packages: Package[]
  stats: { totalSold: number; totalActive: number; totalUsed: number }
}) {
  const [modal, setModal] = useState<'create' | 'sell' | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="section-eyebrow">trainer·créditos</div>
          <h1 className="text-2xl font-bold text-text">Gestión de Créditos</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('sell')} className="btn-secondary btn-sm">
            Vender paquete
          </button>
          <button onClick={() => setModal('create')} className="btn-primary btn-sm">
            + Nuevo paquete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="stat-label">Créditos vendidos</p>
          <p className="stat-value">{stats.totalSold}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Créditos activos</p>
          <p className="stat-value text-accent">{stats.totalActive}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Créditos usados</p>
          <p className="stat-value text-text-muted">{stats.totalUsed}</p>
        </div>
      </div>

      {/* Packages */}
      {packages.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Paquetes disponibles
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card-sm flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary font-mono">{pkg.totalCredits}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{pkg.name}</p>
                  <p className="text-[11px] text-text-muted">{pkg.creditType} · {pkg.price}€</p>
                </div>
                <button
                  onClick={() => setModal('sell')}
                  className="btn-ghost btn-sm text-xs"
                >
                  Vender
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client balances */}
      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◆</div>
          <p className="text-text font-medium text-sm mb-1">Sin clientes todavía</p>
          <p className="text-text-muted text-xs mb-4">
            Los créditos de tus clientes aparecerán aquí
          </p>
          <Link href="/trainer/clients" className="btn-primary btn-sm">
            Ver Clientes
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Saldo por cliente
          </p>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="card-hover flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-md bg-accent/15 border border-accent/25
                              flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{client.name}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-base font-bold font-mono ${client.balance > 0 ? 'text-accent' : 'text-text-muted'}`}>
                  {client.balance}
                </span>
                <span className="text-[10px] text-text-muted">créditos</span>
              </div>
              <span className="text-text-muted text-xs opacity-40">›</span>
            </Link>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 card w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text">
                {modal === 'create' ? 'Nuevo paquete' : 'Vender paquete'}
              </h2>
              <button onClick={() => setModal(null)} className="btn-icon text-text-muted">✕</button>
            </div>
            {modal === 'create' && (
              <CreatePackageForm onDone={() => setModal(null)} />
            )}
            {modal === 'sell' && (
              <SellPackageForm
                clients={clients}
                packages={packages}
                onDone={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
