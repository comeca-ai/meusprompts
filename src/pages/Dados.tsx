import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  Download,
  Mail,
  MousePointerClick,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SECTORS, getSector } from '@/lib/sectors'
import {
  clearEvents,
  exportEventsJson,
  getEvents,
  getLead,
  getUsageCount,
  summarizeBySector,
} from '@/lib/tracker'

export default function Dados() {
  const [version, setVersion] = useState(0)

  const events = useMemo(() => getEvents(), [version])
  const summary = useMemo(() => summarizeBySector(), [version])
  const usageCount = useMemo(() => getUsageCount(), [version])
  const lead = useMemo(() => getLead(), [version])

  const totalUses = events.filter((e) => e.type === 'use').length
  const totalLeads = events.filter((e) => e.type === 'lead').length
  const topSector = summary[0] ? getSector(summary[0].sector).label : '—'
  const maxUses = Math.max(1, ...summary.map((s) => s.uses))

  // Garante que os 6 setores apareçam, mesmo sem eventos
  const rows = SECTORS.map((sector) => {
    const found = summary.find((s) => s.sector === sector.id)
    return { sector, uses: found?.uses ?? 0, leads: found?.leads ?? 0 }
  }).sort((a, b) => b.uses - a.uses)

  const recentEvents = [...events].reverse().slice(0, 50)

  function handleExport() {
    const blob = new Blob([exportEventsJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'melhore-meu-prompt-eventos.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleClear() {
    if (window.confirm('Apagar todos os eventos locais? Isso não pode ser desfeito.')) {
      clearEvents()
      setVersion((v) => v + 1)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a ferramenta
        </Link>

        <h1 className="mt-6 font-display text-3xl font-semibold text-primary md:text-4xl">
          Sensor de demanda
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dados armazenados apenas neste navegador (localStorage).
          {lead && (
            <>
              {' '}
              Lead capturado:{' '}
              <span className="font-semibold text-foreground">
                {lead.name} ({lead.email})
              </span>
              .
            </>
          )}
        </p>

        {/* Cards-resumo */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              Usos da ferramenta
            </div>
            <p className="mt-2 font-display text-4xl font-bold text-primary">
              {Math.max(usageCount, totalUses)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Mail className="h-4 w-4" />
              Leads capturados
            </div>
            <p className="mt-2 font-display text-4xl font-bold text-primary">
              {totalLeads}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Setor mais procurado
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-primary">
              {topSector}
            </p>
          </div>
        </div>

        {/* Demanda por setor */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-display text-xl font-semibold text-primary">
            Demanda por setor
          </h2>
          <div className="mt-5 space-y-3">
            {rows.map(({ sector, uses, leads }) => (
              <div key={sector.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <sector.icon className="h-4 w-4 text-primary" />
                </span>
                <span className="w-36 shrink-0 text-sm font-medium text-foreground">
                  {sector.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(uses / maxUses) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {uses} uso{uses === 1 ? '' : 's'} · {leads} lead{leads === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eventos recentes */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-display text-xl font-semibold text-primary">
            Eventos recentes
          </h2>
          {recentEvents.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum evento registrado ainda. Use a ferramenta na página inicial
              para começar a medir a demanda.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {recentEvents.map((ev, i) => (
                <li
                  key={`${ev.ts}-${i}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span
                    className={
                      ev.type === 'lead'
                        ? 'rounded-full bg-[hsl(var(--coral))]/15 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--coral-deep))]'
                        : 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'
                    }
                  >
                    {ev.type === 'lead' ? 'lead' : 'uso'}
                  </span>
                  <span className="font-medium text-foreground">
                    {getSector(ev.sector).label}
                  </span>
                  {ev.type === 'lead' && ev.email && (
                    <span className="text-xs text-muted-foreground">
                      {ev.name} · {ev.email}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(ev.ts).toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {events.length > 50 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Mostrando os 50 mais recentes de {events.length} eventos. Exporte o
              JSON para ver todos.
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar dados
          </Button>
        </div>
      </div>
    </div>
  )
}
