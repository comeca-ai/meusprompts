import { Link } from 'react-router'
import {
  ArrowLeft,
  Download,
  Loader2,
  LogIn,
  Mail,
  MousePointerClick,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SECTORS, getSector } from '@/lib/sectors'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'

const EVENT_LABEL: Record<string, string> = {
  use: 'uso',
  gate_login: 'login no gate',
  cta_whatsapp: 'WhatsApp',
}

export default function Dados() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const statsQuery = trpc.leads.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  })

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <h1 className="font-display text-3xl font-semibold text-primary">
          Entre para ver o painel
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          O sensor de demanda agora vive no servidor. Entre com a sua conta para
          ver usos, leads e cliques no WhatsApp.
        </p>
        <Button
          asChild
          className="rounded-full bg-primary px-6 py-5 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Link to={LOGIN_PATH}>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar com a minha conta
          </Link>
        </Button>
      </div>
    )
  }

  const stats = statsQuery.data
  const totals = stats?.totals
  const uses = Number(totals?.uses ?? 0)
  const gateLogins = Number(totals?.gateLogins ?? 0)
  const ctaClicks = Number(totals?.ctaClicks ?? 0)

  const bySector = stats?.bySector ?? []
  const maxCount = Math.max(1, ...bySector.map((s) => Number(s.count)))
  const topSectorId = bySector[0]?.sector
  const topSector = topSectorId ? getSector(topSectorId).label : '—'

  // Garante que os 6 setores apareçam, mesmo sem eventos
  const rows = SECTORS.map((sector) => {
    const found = bySector.find((s) => s.sector === sector.id)
    return { sector, count: Number(found?.count ?? 0) }
  }).sort((a, b) => b.count - a.count)

  const leads = stats?.leads ?? []
  const recentEvents = stats?.recentEvents ?? []

  function handleExport() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), ...stats },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'melhore-meu-prompt-stats.json'
    a.click()
    URL.revokeObjectURL(url)
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
          Dados ao vivo do servidor (todos os visitantes, não só este
          navegador).
        </p>

        {statsQuery.isLoading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : statsQuery.isError ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Não consegui carregar os dados do servidor. Tente recarregar a
            página.
          </p>
        ) : (
          <>
            {/* Cards-resumo */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MousePointerClick className="h-4 w-4" />
                  Usos da ferramenta
                </div>
                <p className="mt-2 font-display text-4xl font-bold text-primary">
                  {uses}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <LogIn className="h-4 w-4" />
                  Logins no gate
                </div>
                <p className="mt-2 font-display text-4xl font-bold text-primary">
                  {gateLogins}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Cliques no WhatsApp
                </div>
                <p className="mt-2 font-display text-4xl font-bold text-primary">
                  {ctaClicks}
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
                {rows.map(({ sector, count }) => (
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
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                      {count} uso{count === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-warm">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
                <Users className="h-5 w-5" />
                Leads
              </h2>
              {leads.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum lead autenticado ainda.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-2 pr-4 font-semibold">Nome</th>
                        <th className="pb-2 pr-4 font-semibold">Email</th>
                        <th className="pb-2 pr-4 font-semibold">
                          Setor de interesse
                        </th>
                        <th className="pb-2 font-semibold">Último acesso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr
                          key={lead.unionId ?? lead.email ?? i}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-2.5 pr-4 font-medium text-foreground">
                            {lead.name ?? '—'}
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">
                            {lead.email ?? '—'}
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">
                            {lead.sectorInterest
                              ? getSector(lead.sectorInterest).label
                              : '—'}
                          </td>
                          <td className="py-2.5 text-xs text-muted-foreground">
                            {lead.lastSignInAt
                              ? new Date(lead.lastSignInAt).toLocaleString(
                                  'pt-BR',
                                )
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Eventos recentes */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-warm">
              <h2 className="font-display text-xl font-semibold text-primary">
                Eventos recentes
              </h2>
              {recentEvents.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum evento registrado ainda. Use a ferramenta na página
                  inicial para começar a medir a demanda.
                </p>
              ) : (
                <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {recentEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                    >
                      <span
                        className={
                          ev.type === 'use'
                            ? 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'
                            : 'rounded-full bg-[hsl(var(--coral))]/15 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--coral-deep))]'
                        }
                      >
                        {EVENT_LABEL[ev.type] ?? ev.type}
                      </span>
                      <span className="font-medium text-foreground">
                        {ev.sector ? getSector(ev.sector).label : '—'}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(ev.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </li>
                  ))}
                </ul>
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}
