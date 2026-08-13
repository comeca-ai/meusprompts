import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Code2,
  Globe,
  History,
  Layers,
  LayoutGrid,
  Lightbulb,
  List,
  Lock,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import {
  AppShell,
  EmptyState,
  PromptCard,
  StatCard,
  toastSuccess,
  toastUndo,
  useAppShell,
} from '@/components/app'
import { cn } from '@/lib/utils'
import {
  VAULT_CATEGORIES,
  fullDatePt,
  getSectorMeta,
  relTime,
  type VaultPrompt,
} from '@/lib/vault'

type SortId = 'recentes' | 'az' | 'antigos' | 'versoes'
type ViewMode = 'grid' | 'list'
type VisFilter = 'all' | 'public' | 'private' | 'favorites'

const QUICK_TIPS = [
  'Use {{nome_do_cliente}} nos prompts — o editor detecta variáveis automaticamente.',
  'Ctrl+S salva e cria uma versão nova. Peça à IA para melhorar com o playbook do seu setor.',
  'Prompts públicos aparecem na comunidade meusprompts — seu nome não é exibido.',
]

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export default function Dashboard() {
  return (
    <AppShell title="Minha Biblioteca" subtitle="Seus prompts, com histórico e voz da sua marca">
      <DashboardContent />
    </AppShell>
  )
}

function DashboardContent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openImprove } = useAppShell()
  const utils = trpc.useUtils()

  // ===== Dados =====
  const listQuery = trpc.vault.list.useQuery({})
  const statsQuery = trpc.vault.stats.useQuery()
  const libraryQuery = trpc.library.list.useQuery({})

  const prompts = useMemo(
    () => (listQuery.data ?? []) as VaultPrompt[],
    [listQuery.data],
  )

  // ===== Filtros =====
  const [searchInput, setSearchInput] = useState('')
  const [term, setTerm] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [vis, setVis] = useState<VisFilter>('all')
  const [sort, setSort] = useState<SortId>('recentes')
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem('vault-view') === 'list' ? 'list' : 'grid',
  )
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(searchInput.trim()), 250)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    localStorage.setItem('vault-view', view)
  }, [view])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of prompts) map.set(p.category, (map.get(p.category) ?? 0) + 1)
    return map
  }, [prompts])

  const filtered = useMemo(() => {
    const needle = term.toLowerCase()
    let out = prompts.filter((p) => {
      if (category && p.category !== category) return false
      if (vis === 'public' && p.visibility !== 'public') return false
      if (vis === 'private' && p.visibility !== 'private') return false
      if (vis === 'favorites' && !p.isFavorite) return false
      if (
        needle &&
        !p.title.toLowerCase().includes(needle) &&
        !p.content.toLowerCase().includes(needle)
      )
        return false
      return true
    })
    out = [...out]
    if (sort === 'az') out.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    else if (sort === 'antigos')
      out.sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      )
    else if (sort === 'versoes') out.sort((a, b) => b.currentVersion - a.currentVersion)
    return out
  }, [prompts, category, vis, term, sort])

  const hasFilter = category !== null || vis !== 'all' || term.length > 0
  const clearFilters = () => {
    setCategory(null)
    setVis('all')
    setSearchInput('')
    setTerm('')
  }

  const applyVisFilter = (v: VisFilter) => {
    setVis(v)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ===== Mutações =====
  const invalidate = () => {
    void utils.vault.list.invalidate()
    void utils.vault.stats.invalidate()
  }

  const toggleFavorite = trpc.vault.toggleFavorite.useMutation({
    onSuccess: invalidate,
  })
  const createPrompt = trpc.vault.create.useMutation({ onSuccess: invalidate })
  const savePrompt = trpc.vault.save.useMutation({ onSuccess: invalidate })
  const removePrompt = trpc.vault.remove.useMutation({ onSuccess: invalidate })

  const [toDelete, setToDelete] = useState<VaultPrompt | null>(null)

  const handleCopy = async (p: VaultPrompt) => {
    try {
      await navigator.clipboard.writeText(p.content)
      toastSuccess('Prompt copiado')
    } catch {
      toastSuccess('Não foi possível copiar automaticamente')
    }
  }

  const handleImprove = (p: VaultPrompt) => {
    openImprove({
      prompt: p.content,
      sector: p.sector,
      onApply: (improved, sectorId, sectorLabel) => {
        savePrompt.mutate(
          {
            id: p.id,
            title: p.title,
            content: improved,
            category: p.category,
            sector: sectorId,
            visibility: p.visibility as 'public' | 'private',
            changeNote: `Melhoria por IA · playbook ${sectorLabel}`,
            source: 'ai',
          },
          {
            onSuccess: (updated) => {
              toastSuccess(
                `Versão v${updated?.currentVersion ?? p.currentVersion + 1} criada pela IA`,
              )
            },
          },
        )
      },
    })
  }

  const handleDuplicate = (p: VaultPrompt) => {
    createPrompt.mutate(
      {
        title: `${p.title} (cópia)`,
        content: p.content,
        category: p.category,
        sector: p.sector ?? undefined,
        visibility: 'private',
      },
      { onSuccess: () => toastSuccess('Prompt duplicado') },
    )
  }

  const handleToggleVisibility = (p: VaultPrompt) => {
    const next = p.visibility === 'public' ? 'private' : 'public'
    savePrompt.mutate(
      {
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
        sector: p.sector,
        visibility: next,
        changeNote:
          next === 'public' ? 'Tornou o prompt público' : 'Tornou o prompt privado',
      },
      {
        onSuccess: () =>
          toastSuccess(next === 'public' ? 'Prompt público' : 'Prompt privado'),
      },
    )
  }

  const confirmDelete = () => {
    if (!toDelete) return
    const p = toDelete
    setToDelete(null)
    removePrompt.mutate(
      { id: p.id },
      {
        onSuccess: () =>
          toastUndo('Prompt excluído', () => {
            createPrompt.mutate(
              {
                title: p.title,
                content: p.content,
                category: p.category,
                sector: p.sector ?? undefined,
                visibility: p.visibility as 'public' | 'private',
              },
              { onSuccess: () => toastSuccess('Prompt restaurado') },
            )
          }),
      },
    )
  }

  // ===== Derivados do header =====
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const stats = statsQuery.data
  const total = stats?.total ?? 0
  const favPct = total > 0 ? Math.round(((stats?.favorites ?? 0) / total) * 100) : 0

  // Prompt da biblioteca rotativo (1 por dia)
  const dailyItem = useMemo(() => {
    const items = libraryQuery.data ?? []
    if (items.length === 0) return null
    const day = Math.floor(Date.now() / 86400000)
    return items[day % items.length]
  }, [libraryQuery.data])

  const tipOfDay = QUICK_TIPS[Math.floor(Date.now() / 86400000) % QUICK_TIPS.length]

  // FAB mobile: esconde ao rolar para baixo
  const [fabHidden, setFabHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setFabHidden(y > last && y > 120)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loading = listQuery.isLoading

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      {/* ===== Header da página ===== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            {...fadeUp}
            className="text-[11px] font-semibold uppercase tracking-wide text-[#3e7aef]"
          >
            Meu vault
          </motion.p>
          <motion.h2
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.07 }}
            className="mt-1 font-display text-[26px] font-bold tracking-tight text-[#0b1020]"
          >
            {firstName ? `Olá, ${firstName}` : 'Olá, bem-vindo de volta'}
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.14 }}
            className="mt-1 text-sm text-[#55617c]"
          >
            {fullDatePt()} ·{' '}
            {total > 0
              ? `Sua IA está falando com a sua voz em ${total} prompt${total === 1 ? '' : 's'}.`
              : 'Comece guardando seu primeiro prompt.'}
          </motion.p>
        </div>
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.21 }}
          className="hidden items-center gap-2 lg:flex"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/app/biblioteca')}
            className="text-[#3e7aef] hover:bg-[#eaf0ff]"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Importar da biblioteca
          </Button>
          <Button
            onClick={() => navigate('/app/prompts/novo')}
            className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo prompt
          </Button>
        </motion.div>
      </div>

      <div className="mt-6 flex gap-6">
        {/* ===== Coluna principal ===== */}
        <div className="min-w-0 flex-1">
          {/* StatCards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                key: 'total',
                icon: Layers,
                label: 'Total de prompts',
                value: stats?.total ?? 0,
                chip: undefined,
                iconColor: '#3e7aef',
                onClick: () => applyVisFilter('all'),
                active: vis === 'all' && !category,
              },
              {
                key: 'fav',
                icon: Star,
                label: 'Favoritos',
                value: stats?.favorites ?? 0,
                chip: total > 0 ? `${favPct}% favoritos` : undefined,
                iconColor: '#f2a63b',
                onClick: () => applyVisFilter('favorites'),
                active: vis === 'favorites',
              },
              {
                key: 'pub',
                icon: Globe,
                label: 'Públicos',
                value: stats?.publics ?? 0,
                chip: 'compartilhados',
                iconColor: '#3e7aef',
                onClick: () => applyVisFilter('public'),
                active: vis === 'public',
              },
              {
                key: 'priv',
                icon: Lock,
                label: 'Privados',
                value: stats?.privates ?? 0,
                chip: 'só você vê',
                iconColor: '#55617c',
                onClick: () => applyVisFilter('private'),
                active: vis === 'private',
              },
            ].map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <StatCard
                  icon={s.icon}
                  label={s.label}
                  value={s.value}
                  chip={s.chip}
                  iconColor={s.iconColor}
                  active={s.active}
                  onClick={s.onClick}
                />
              </motion.div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="sticky top-[60px] z-20 -mx-2 mt-6 bg-[#f5f7fc]/90 px-2 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[420px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b97b8]" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por título ou conteúdo…"
                  className="h-10 w-full rounded-full border border-[#e3e9f6] bg-white pl-10 pr-16 text-sm text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
                />
                {searchInput ? (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setSearchInput('')
                      setTerm('')
                    }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8b97b8] hover:text-[#0b1020]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <kbd className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded border border-[#e3e9f6] bg-[#f5f7fc] px-1.5 py-0.5 text-[10px] font-medium text-[#8b97b8]">
                  ⌘K
                </kbd>
              </div>

              <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
                <SelectTrigger className="h-10 w-[190px] rounded-full border-[#e3e9f6] bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="az">A–Z</SelectItem>
                  <SelectItem value="antigos">Atualizados há mais tempo</SelectItem>
                  <SelectItem value="versoes">Mais versões</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex rounded-full border border-[#e3e9f6] bg-white p-1">
                {(
                  [
                    { id: 'grid', icon: LayoutGrid, label: 'Grade' },
                    { id: 'list', icon: List, label: 'Lista' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={v.label}
                    onClick={() => setView(v.id)}
                    className={cn(
                      'rounded-full p-1.5 transition-colors',
                      view === v.id
                        ? 'bg-[#eaf0ff] text-[#3e7aef]'
                        : 'text-[#8b97b8] hover:text-[#55617c]',
                    )}
                  >
                    <v.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Chips */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <FilterChip
                selected={category === null}
                onClick={() => setCategory(null)}
                label="Todas"
              />
              {VAULT_CATEGORIES.map((c, i) => {
                const count = categoryCounts.get(c.id) ?? 0
                return (
                  <motion.span
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
                  >
                    <FilterChip
                      selected={category === c.id}
                      onClick={() => setCategory(category === c.id ? null : c.id)}
                      label={count > 0 ? `${c.label} · ${count}` : c.label}
                      dot={c.color}
                    />
                  </motion.span>
                )
              })}

              <span className="mx-1 h-5 w-px shrink-0 bg-[#e3e9f6]" />

              <div className="flex shrink-0 rounded-full border border-[#e3e9f6] bg-white p-0.5">
                {(
                  [
                    { id: 'all', label: 'Todos', icon: null },
                    { id: 'public', label: 'Públicos', icon: Globe },
                    { id: 'private', label: 'Privados', icon: Lock },
                    { id: 'favorites', label: 'Favoritos', icon: Star },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVis(v.id)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                      vis === v.id
                        ? 'bg-[#eaf0ff] text-[#3e7aef]'
                        : 'text-[#55617c] hover:text-[#0b1020]',
                    )}
                  >
                    {v.icon ? <v.icon className="h-3 w-3" /> : null}
                    {v.label}
                  </button>
                ))}
              </div>

              {hasFilter ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-[#eaf0ff] px-2.5 py-1 text-[11.5px] font-semibold text-[#3e7aef] transition-colors hover:bg-[#dbe7ff]"
                >
                  <X className="h-3 w-3" />
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>

          {/* Grid */}
          <div ref={gridRef} className="scroll-mt-[140px] pt-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[188px] rounded-xl bg-[#e3e9f6]/60" />
                ))}
              </div>
            ) : prompts.length === 0 ? (
              <EmptyState
                image="/empty-vault.svg"
                title="Sua biblioteca está esperando o primeiro prompt"
                description="Guarde os prompts que você já usa no ChatGPT, Claude ou Gemini — ou importe prontos da biblioteca do seu setor."
                primaryAction={{
                  label: 'Criar primeiro prompt',
                  icon: <Plus className="mr-2 h-4 w-4" />,
                  onClick: () => navigate('/app/prompts/novo'),
                }}
                secondaryAction={{
                  label: 'Explorar biblioteca',
                  icon: <BookOpen className="mr-2 h-4 w-4" />,
                  onClick: () => navigate('/app/biblioteca'),
                }}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                image="/empty-search.svg"
                title={`Nada encontrado para "${term || 'esse filtro'}"`}
                description="Tente outra palavra ou limpe os filtros."
                primaryAction={{
                  label: 'Limpar filtros',
                  icon: <X className="mr-2 h-4 w-4" />,
                  onClick: clearFilters,
                }}
              />
            ) : (
              <motion.div
                layout
                className={cn(
                  'gap-4',
                  view === 'grid'
                    ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    : 'flex flex-col',
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((p, i) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.25,
                        delay: Math.min(i, 12) * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <PromptCard
                        prompt={p}
                        term={term}
                        onOpen={(pr) => navigate(`/app/prompts/${pr.id}`)}
                        onCopy={handleCopy}
                        onToggleFavorite={(pr) =>
                          toggleFavorite.mutate({ id: pr.id })
                        }
                        onImprove={handleImprove}
                        onDuplicate={handleDuplicate}
                        onToggleVisibility={handleToggleVisibility}
                        onShowVersions={(pr) => navigate(`/app/prompts/${pr.id}`)}
                        onDelete={(pr) => setToDelete(pr)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Biblioteca inline (mobile/tablet) */}
          {dailyItem ? (
            <div className="mt-6 xl:hidden">
              <LibraryPromo
                title={dailyItem.title}
                content={dailyItem.content}
                sector={dailyItem.sector}
                onSave={() =>
                  createPrompt.mutate(
                    {
                      title: dailyItem.title,
                      content: dailyItem.content,
                      sector: dailyItem.sector ?? undefined,
                      visibility: 'private',
                    },
                    { onSuccess: () => toastSuccess('Salvo na sua biblioteca') },
                  )
                }
              />
            </div>
          ) : null}
        </div>

        {/* ===== Rail direito (xl+) ===== */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-[76px] hidden w-[300px] shrink-0 self-start xl:block"
        >
          <div className="flex flex-col gap-4">
            {/* Atividade recente */}
            <div className="rounded-xl border border-[#e3e9f6] bg-white p-4 shadow-warm">
              <h3 className="font-display text-[13px] font-semibold text-[#0b1020]">
                Atividade recente
              </h3>
              <ul className="mt-3 space-y-3">
                {prompts.slice(0, 5).map((p) => {
                  const isPublic = p.visibility === 'public'
                  const Icon = p.isFavorite ? Star : isPublic ? Globe : History
                  return (
                    <li key={p.id} className="flex items-start gap-2.5">
                      <Icon
                        className={cn(
                          'mt-0.5 h-3.5 w-3.5 shrink-0',
                          p.isFavorite
                            ? 'text-[#f2a63b]'
                            : isPublic
                              ? 'text-[#3e7aef]'
                              : 'text-[#3e7aef]',
                        )}
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[13px] leading-snug text-[#0b1020]">
                          {p.isFavorite
                            ? `“${p.title}” está nos favoritos`
                            : isPublic
                              ? `“${p.title}” ficou pública`
                              : `v${p.currentVersion} de “${p.title}” salva`}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8b97b8]">
                          {relTime(p.updatedAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
                {prompts.length === 0 ? (
                  <li className="flex items-start gap-2.5 text-[13px] text-[#8b97b8]">
                    <Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Suas atividades aparecem aqui.
                  </li>
                ) : null}
              </ul>
            </div>

            {/* Da biblioteca */}
            {dailyItem ? (
              <LibraryPromo
                title={dailyItem.title}
                content={dailyItem.content}
                sector={dailyItem.sector}
                onSave={() =>
                  createPrompt.mutate(
                    {
                      title: dailyItem.title,
                      content: dailyItem.content,
                      sector: dailyItem.sector ?? undefined,
                      visibility: 'private',
                    },
                    { onSuccess: () => toastSuccess('Salvo na sua biblioteca') },
                  )
                }
              />
            ) : null}

            {/* Dica rápida */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[#eaf0ff] p-4">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#3e7aef]" />
              <p className="text-[13px] leading-relaxed text-[#0b1020]">{tipOfDay}</p>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* FAB mobile */}
      <motion.div
        animate={{ y: fabHidden ? 80 : 0 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-5 right-5 z-30 lg:hidden"
      >
        <button
          type="button"
          aria-label="Novo prompt"
          onClick={() => navigate('/app/prompts/novo')}
          className="shadow-warm-lg flex h-14 w-14 items-center justify-center rounded-full bg-[#3e7aef] text-white transition-colors hover:bg-[#2f5fd0]"
        >
          <Plus className="h-6 w-6" />
        </button>
      </motion.div>

      {/* Confirmação de exclusão */}
      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {toDelete ? `“${toDelete.title}”` : 'prompt'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#d64545] text-white hover:bg-[#b93a3a]"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterChip({
  selected,
  onClick,
  label,
  dot,
}: {
  selected: boolean
  onClick: () => void
  label: string
  dot?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-[#3e7aef] bg-[#3e7aef] text-white'
          : 'border-[#e3e9f6] bg-white text-[#55617c] hover:border-[#3e7aef]/50',
      )}
    >
      {dot ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: selected ? '#ffffff' : dot }}
        />
      ) : null}
      {label}
    </button>
  )
}

function LibraryPromo({
  title,
  content,
  sector,
  onSave,
}: {
  title: string
  content: string
  sector: string | null
  onSave: () => void
}) {
  const meta = getSectorMeta(sector)
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0b1020] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-[#8fb2ff]/[0.12] blur-2xl"
      />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8fb2ff]">
        Biblioteca
      </p>
      <h4 className="mt-2 font-display text-sm font-semibold text-white">{title}</h4>
      {meta ? (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8b97b8]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.label}
        </p>
      ) : null}
      <p className="mt-2 line-clamp-2 font-mono text-[11.5px] leading-relaxed text-[#8b97b8]">
        {content}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={onSave}
          className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
        >
          Salvar no vault
        </Button>
        <Link
          to="/app/biblioteca"
          className="text-[12.5px] font-medium text-[#8fb2ff] hover:underline"
        >
          Ver biblioteca
        </Link>
      </div>
    </div>
  )
}
