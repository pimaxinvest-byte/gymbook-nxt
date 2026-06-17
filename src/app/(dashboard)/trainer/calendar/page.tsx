// ─── GymBook NXT · Trainer Calendar ──────────────────────────────────────────
// Vista semanal completa — todos los trainers, todos los eventos
// Voltaic Nocturne design system

import React               from 'react'
import { auth }           from '@/auth'
import { prisma }         from '@/lib/prisma'
import { addDays, format, startOfWeek } from 'date-fns'
import { es }             from 'date-fns/locale'
import CalendarWeekClient from './CalendarWeekClient'

// ─── DATA ─────────────────────────────────────────────────────────────────────
async function getCalendarData(weekStart: Date) {
  const start = new Date(weekStart); start.setHours(0,0,0,0)
  const end   = addDays(start, 6);  end.setHours(23,59,59,999)

  const [slots, sessions, holidays, trainers] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            trainerProfile: { select: { calendarColor: true } },
          },
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            client: { include: { user: { select: { name: true } } } },
            activityType: { select: { code: true, name: true } },
          },
          take: 5, // SGT can have up to 5
        },
      },
      orderBy: [{ date: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.session.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
        slotId: null, // sessions without a formal slot
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            trainerProfile: { select: { calendarColor: true } },
          },
        },
        client: { include: { user: { select: { name: true } } } },
        activityType: { select: { code: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.publicHoliday.findMany({
      where: {
        date: { gte: start, lte: end },
        scope: { in: ['NATIONAL', 'ANDALUCIA', 'TORREMOLINOS'] },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'TRAINER', isActive: true },
      select: {
        id: true,
        name: true,
        trainerProfile: { select: { calendarColor: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return { slots, sessions, holidays, trainers }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function TrainerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const session   = await auth()
  const trainerId = session?.user?.id ?? ''
  const params    = await searchParams

  // Determinar semana a mostrar
  const weekParam = params.week
  let weekStart: Date
  if (weekParam) {
    weekStart = new Date(weekParam + 'T00:00:00')
  } else {
    weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // lunes
  }
  weekStart.setHours(0,0,0,0)

  const { slots, sessions: freeBookings, holidays, trainers } = await getCalendarData(weekStart)

  const prevWeek = addDays(weekStart, -7)
  const nextWeek = addDays(weekStart,  7)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Construir estructura de días (Lun–Dom)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date    = addDays(weekStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const holiday = holidays.find(h => format(new Date(h.date), 'yyyy-MM-dd') === dateStr)
    return { date, dateStr, holiday, isToday: dateStr === todayStr }
  })

  // Horas del día (8h – 20h)
  const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i)

  // Total slots this week (stat)
  const totalOpen  = slots.filter(s => s.isOpen && s.bookings.length === 0).length
  const totalBooked = slots.filter(s => s.bookings.length > 0).length

  return (
    <div style={{ color: '#F1F1F1' }} className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1"
            style={{ color: '#52525B' }}>
            trainer · calendario
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {capitalize(format(weekStart, "MMMM yyyy", { locale: es }))}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#71717A' }}>
            Semana {format(weekStart, "'del' d")} al {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 flex-shrink-0">
          <div className="px-3 py-1.5 rounded-lg text-center"
            style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.15)' }}>
            <div className="text-lg font-mono font-bold" style={{ color: '#3B82F6' }}>{totalOpen}</div>
            <div className="text-[9px] font-mono" style={{ color: '#71717A' }}>libres</div>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-center"
            style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.15)' }}>
            <div className="text-lg font-mono font-bold" style={{ color: '#22C55E' }}>{totalBooked}</div>
            <div className="text-[9px] font-mono" style={{ color: '#71717A' }}>ocupadas</div>
          </div>
        </div>
      </div>

      {/* ── Week nav + legend ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <a href={`/trainer/calendar?week=${format(prevWeek, 'yyyy-MM-dd')}`}
            className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
            style={{ background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #27272A' }}>
            ← anterior
          </a>
          <a href="/trainer/calendar"
            className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
            style={{ background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #27272A' }}>
            hoy
          </a>
          <a href={`/trainer/calendar?week=${format(nextWeek, 'yyyy-MM-dd')}`}
            className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
            style={{ background: '#1A1A1A', color: '#A1A1AA', border: '1px solid #27272A' }}>
            siguiente →
          </a>
        </div>

        {/* Trainer legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {trainers.map(t => {
            const color = t.trainerProfile?.calendarColor ?? '#3B82F6'
            return (
              <div key={t.id} className="flex items-center gap-1.5 text-[11px] font-mono">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span style={{ color: '#A1A1AA' }}>{t.name}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 text-[9px] font-mono ml-2 pl-2"
            style={{ color: '#52525B', borderLeft: '1px solid #27272A' }}>
            <span>◌ abierta</span>
            <span>● reservada</span>
          </div>
        </div>
      </div>

      {/* ── Main Calendar Grid ── */}
      <div style={{
        background: '#0D0D0D',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        overflow: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px repeat(7, minmax(80px, 1fr))',
          minWidth: 680,
        }}>

          {/* ── Column headers ── */}
          <div style={{
            borderBottom: '1px solid #1A1A1A',
            padding: '8px 0',
          }} />
          {days.map(({ date, dateStr, isToday, holiday }) => (
            <div key={dateStr}
              style={{
                borderBottom: '1px solid #1A1A1A',
                borderLeft: '1px solid #1A1A1A',
                padding: '8px 6px',
                textAlign: 'center',
                background: holiday ? 'rgba(239,68,68,.04)' : isToday ? 'rgba(59,130,246,.04)' : 'transparent',
              }}>
              <div className="text-[9px] font-mono uppercase tracking-widest"
                style={{ color: holiday ? '#EF4444' : '#52525B' }}>
                {format(date, 'EEE', { locale: es })}
              </div>
              <div className="text-base font-mono font-bold leading-tight"
                style={{
                  color: isToday ? '#3B82F6' : holiday ? '#EF4444' : '#F1F1F1',
                }}>
                {format(date, 'd')}
              </div>
              {holiday && (
                <div className="text-[8px] font-mono truncate leading-tight mt-0.5 px-0.5"
                  style={{ color: '#EF4444', opacity: 0.8 }}>
                  {holiday.name}
                </div>
              )}
            </div>
          ))}

          {/* ── Hour rows ── */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div
                style={{
                  borderBottom: '1px solid #111',
                  padding: '4px 6px 4px 0',
                  textAlign: 'right',
                  verticalAlign: 'top',
                }}>
                <span className="text-[9px] font-mono" style={{ color: '#3A3A3A' }}>
                  {hour}h
                </span>
              </div>

              {/* Day cells */}
              {days.map(({ dateStr, holiday }) => {
                const daySlots = slots.filter(
                  s =>
                    format(new Date(s.date), 'yyyy-MM-dd') === dateStr &&
                    s.startHour === hour
                )
                const unslotted = freeBookings.filter(b => {
                  const bDate = format(new Date(b.scheduledAt), 'yyyy-MM-dd')
                  const bHour = new Date(b.scheduledAt).getHours()
                  return bDate === dateStr && bHour === hour
                })

                const isCurrentHour = dateStr === todayStr && new Date().getHours() === hour

                return (
                  <div key={`${dateStr}-${hour}`}
                    style={{
                      borderLeft: '1px solid #1A1A1A',
                      borderBottom: '1px solid #111',
                      minHeight: 48,
                      padding: 3,
                      position: 'relative',
                      background: isCurrentHour
                        ? 'rgba(59,130,246,.04)'
                        : holiday ? 'rgba(239,68,68,.02)' : 'transparent',
                    }}>

                    {/* Current time indicator */}
                    {isCurrentHour && (
                      <div style={{
                        position: 'absolute', left: 0, right: 0, top: 0,
                        height: 1, background: 'rgba(59,130,246,.4)',
                      }} />
                    )}

                    {/* Availability slots */}
                    {daySlots.map(slot => {
                      const rawColor = slot.trainer?.trainerProfile?.calendarColor ?? '#3B82F6'
                      const rgb = hexToRgb(rawColor)
                      const isBooked = slot.bookings.length > 0
                      const isSGT = slot.bookings.some(b => b.activityType?.code === 'SGT')

                      return (
                        <div key={slot.id}
                          title={isBooked
                            ? slot.bookings.map(b => b.client?.user?.name ?? '?').join(', ')
                            : `${slot.trainer?.name} — disponible`}
                          style={{
                            background: isBooked
                              ? `rgba(${rgb}, 0.85)`
                              : `rgba(${rgb}, 0.15)`,
                            border: `1px solid rgba(${rgb}, ${isBooked ? 0.7 : 0.3})`,
                            borderRadius: 4,
                            padding: '2px 4px',
                            marginBottom: 2,
                            cursor: 'default',
                          }}>
                          {isBooked ? (
                            <>
                              <div className="text-[9px] font-mono font-semibold truncate"
                                style={{ color: '#FFFFFF' }}>
                                {slot.bookings.length === 1
                                  ? slot.bookings[0].client?.user?.name ?? 'Reservado'
                                  : `${slot.bookings.length} clientes`}
                              </div>
                              <div className="text-[8px] font-mono"
                                style={{ color: 'rgba(255,255,255,0.65)' }}>
                                {isSGT ? 'SGT' : 'PT'} · {slot.trainer?.name?.split(' ')[0]}
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] font-mono truncate"
                              style={{ color: rawColor }}>
                              {slot.trainer?.name?.split(' ')[0]} ○
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Sessions without formal slot */}
                    {unslotted.map(b => {
                      const rawColor = b.trainer?.trainerProfile?.calendarColor ?? '#3B82F6'
                      const rgb = hexToRgb(rawColor)
                      return (
                        <div key={b.id}
                          style={{
                            background: `rgba(${rgb}, 0.8)`,
                            border: `1px solid rgba(${rgb}, 0.6)`,
                            borderRadius: 4,
                            padding: '2px 4px',
                            marginBottom: 2,
                          }}>
                          <div className="text-[9px] font-mono font-semibold truncate text-white">
                            {b.client?.user?.name ?? 'Reservado'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Interactive actions ── */}
      <div style={{
        background: '#121212',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: 16,
      }}>
        <h3 className="text-xs font-mono font-semibold mb-3" style={{ color: '#71717A' }}>
          GESTIÓN DE FRANJAS
        </h3>
        <CalendarWeekClient
          weekStart={weekStart.toISOString()}
          trainerId={trainerId}
        />
      </div>
    </div>
  )
}
