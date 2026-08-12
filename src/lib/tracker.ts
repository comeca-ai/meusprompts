/** Sensor de demanda + captura de leads — localStorage + servidor (tRPC), com webhook opcional. */

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../api/router'

/** Cliente tRPC "vanilla" (fora de React) para eventos fire-and-forget. */
const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: 'include',
        })
      },
    }),
  ],
})

export type ServerEventType = 'use' | 'gate_login' | 'cta_whatsapp'

/**
 * Dispara leads.logEvent no servidor. Fire-and-forget: falha nunca quebra o
 * fluxo da UI e nada aqui deve ser awaitado de forma bloqueante.
 */
export function trackServerEvent(type: ServerEventType, sector?: string): void {
  serverClient.leads.logEvent.mutate({ type, sector }).catch(() => {
    /* silencioso de propósito */
  })
}

/** Salva o setor de interesse do usuário autenticado (fire-and-forget). */
export function saveMySectorServer(sector: string): void {
  serverClient.leads.saveMySector.mutate({ sector }).catch(() => {
    /* silencioso de propósito */
  })
}

export interface DemandEvent {
  type: 'use' | 'lead'
  sector: string
  name?: string
  email?: string
  ts: number
}

export interface Lead {
  name: string
  email: string
}

const EVENTS_KEY = 'mmp_events'
const USAGE_KEY = 'mmp_usage_count'
const LEAD_KEY = 'mmp_lead'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getEvents(): DemandEvent[] {
  return readJson<DemandEvent[]>(EVENTS_KEY, [])
}

export function getUsageCount(): number {
  const n = Number(localStorage.getItem(USAGE_KEY) ?? '0')
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function incrementUsage(): void {
  localStorage.setItem(USAGE_KEY, String(getUsageCount() + 1))
}

export function getLead(): Lead | null {
  return readJson<Lead | null>(LEAD_KEY, null)
}

export function saveLead(lead: Lead): void {
  localStorage.setItem(LEAD_KEY, JSON.stringify(lead))
}

/** 1º uso livre; a partir do 2º, exige lead capturado. */
export function canUseFree(): boolean {
  return getUsageCount() < 1 || getLead() !== null
}

function postWebhook(event: DemandEvent): void {
  const url = import.meta.env.VITE_LEAD_WEBHOOK_URL as string | undefined
  if (!url || url.trim().length === 0) return
  // Fire-and-forget: falha no webhook nunca bloqueia o fluxo.
  fetch(url.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {
    /* silencioso de propósito */
  })
}

export function trackEvent(event: Omit<DemandEvent, 'ts'>): void {
  const full: DemandEvent = { ...event, ts: Date.now() }
  try {
    const events = getEvents()
    events.push(full)
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch {
    /* localStorage cheio/indisponível: não bloqueia */
  }
  postWebhook(full)
  // Espelha o uso no servidor (sensor server-side), sem bloquear a UI.
  if (full.type === 'use') {
    trackServerEvent('use', full.sector)
  }
}

export function clearEvents(): void {
  localStorage.removeItem(EVENTS_KEY)
  localStorage.removeItem(USAGE_KEY)
}

export function exportEventsJson(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      usageCount: getUsageCount(),
      lead: getLead(),
      events: getEvents(),
    },
    null,
    2,
  )
}

export interface SectorSummary {
  sector: string
  uses: number
  leads: number
}

export function summarizeBySector(): SectorSummary[] {
  const map = new Map<string, SectorSummary>()
  for (const ev of getEvents()) {
    const row = map.get(ev.sector) ?? { sector: ev.sector, uses: 0, leads: 0 }
    if (ev.type === 'use') row.uses += 1
    if (ev.type === 'lead') row.leads += 1
    map.set(ev.sector, row)
  }
  return [...map.values()].sort((a, b) => b.uses - a.uses)
}
