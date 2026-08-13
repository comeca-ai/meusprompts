import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Loader2,
  Search,
  Wand2,
  X,
} from 'lucide-react'
import {
  AppShell,
  EmptyState,
  toastError,
  toastSuccess,
  useAppShell,
} from '@/components/app'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import { getSectorMeta, type SectorMeta } from '@/lib/vault'
import { getSector } from '@/lib/sectors'
import {
  SECTOR_LIBRARY_CONTENT,
  parseTags,
  suggestVaultCategory,
  type LibraryItemData,
} from '@/lib/library'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** /app/biblioteca/:setor — detalhe do setor (app-biblioteca.md §2). */
export default function LibrarySector() {
  const { setor } = useParams()
  const navigate = useNavigate()
  const meta = getSectorMeta(setor)

  if (!meta) {
    return (
      <AppShell title="Biblioteca" subtitle="Playbooks e prompts-semente por setor">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="shadow-warm rounded-xl border border-[#e3e9f6] bg-white">
            <EmptyState
              image="/empty-search.svg"
              title="Setor não encontrado"
              description="Esse setor não existe na biblioteca. Explore um dos 6 setores disponíveis."
              primaryAction={{
                label: 'Voltar para a biblioteca',
                icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                onClick: () => navigate('/app/biblioteca'),
              }}
            />
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={`Biblioteca · ${meta.label}`}
      subtitle="Playbook do setor e prompts prontos para copiar ou salvar"
    >
      <SectorContent meta={meta} />
    </AppShell>
  )
}

function SectorContent({ meta }: { meta: SectorMeta }) {
  const navigate = useNavigate()
  const { openImprove } = useAppShell()
  const { isAuthenticated } = useAuth()
  const utils = trpc.useUtils()
  const [searchParams, setSearchParams] = useSearchParams()

  const itemsQuery = trpc.library.list.useQuery({ sector: meta.id })
  const vaultQuery = trpc.vault.list.useQuery({})

  const items = useMemo(
    () => (itemsQuery.data ?? []) as LibraryItemData[],
    [itemsQuery.data],
  )

  // Dedup: títulos já presentes no vault (case-insensitive)
  const savedTitles = useMemo(() => {
    const set = new Set<string>()
    for (const p of vaultQuery.data ?? []) {
      set.add(p.title.trim().toLowerCase())
    }
    return set
  }, [vaultQuery.data])

  // ===== Busca local + chips de tags =====
  const [term, setTerm] = useState(searchParams.get('q') ?? '')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Chegada via busca global da visão geral (?q=...) ou troca de setor —
  // ajuste de estado durante o render (sem effect)
  const qParam = searchParams.get('q') ?? ''
  const [prevQ, setPrevQ] = useState(qParam)
  if (prevQ !== qParam) {
    setPrevQ(qParam)
    if (qParam) setTerm(qParam)
  }
  const [prevSector, setPrevSector] = useState(meta.id)
  if (prevSector !== meta.id) {
    setPrevSector(meta.id)
    setActiveTag(null)
  }

  const clearSearch = () => {
    setTerm('')
    setActiveTag(null)
    if (searchParams.has('q')) setSearchParams({}, { replace: true })
  }

  const tags = useMemo(() => {
    const seen: string[] = []
    for (const it of items) {
      for (const t of parseTags(it.tags)) {
        if (!seen.includes(t)) seen.push(t)
      }
    }
    return seen
  }, [items])

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase()
    return items.filter((it) => {
      if (activeTag && !parseTags(it.tags).includes(activeTag)) return false
      if (
        needle &&
        !it.title.toLowerCase().includes(needle) &&
        !it.content.toLowerCase().includes(needle)
      )
        return false
      return true
    })
  }, [items, term, activeTag])

  // ===== Salvar no vault =====
  const createPrompt = trpc.vault.create.useMutation({
    onSuccess: () => {
      void utils.vault.list.invalidate()
    },
  })
  const [savingId, setSavingId] = useState<number | null>(null)

  const handleSave = (item: LibraryItemData) => {
    if (!isAuthenticated) {
      toast('Entre para salvar na sua biblioteca', {
        action: {
          label: 'Entrar',
          onClick: () => {
            window.location.href = LOGIN_PATH
          },
        },
      })
      return
    }
    setSavingId(item.id)
    createPrompt.mutate(
      {
        title: item.title,
        content: item.content,
        category: suggestVaultCategory(item),
        sector: item.sector,
        visibility: 'private',
      },
      {
        onSuccess: () => {
          setSavingId(null)
          toast.success('Salvo na sua biblioteca', {
            action: { label: 'Ver na biblioteca', onClick: () => navigate('/app') },
          })
        },
        onError: () => {
          setSavingId(null)
          toastError('Não foi possível salvar', 'Tente de novo em instantes.')
        },
      },
    )
  }

  const content = SECTOR_LIBRARY_CONTENT[meta.id]
  const sector = getSector(meta.id)
  const Icon = meta.icon

  const copyPlaybook = async () => {
    try {
      await navigator.clipboard.writeText(sector.playbook)
      toastSuccess('Playbook copiado')
    } catch {
      toastError('Não foi possível copiar automaticamente')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="mx-auto max-w-[1400px] px-6 py-6"
    >
      {/* ===== Header do setor (cor transiciona 300ms ao trocar de setor) ===== */}
      <section
        style={{
          backgroundColor: `${meta.color}1a`,
          borderColor: `${meta.color}4d`,
        }}
        className="rounded-2xl border p-5 transition-colors duration-300 md:p-8"
      >
        <button
          type="button"
          onClick={() => navigate('/app/biblioteca')}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-[#55617c] transition-colors hover:bg-white/60 hover:text-[#0b1020]"
        >
          <ArrowLeft className="h-4 w-4" />
          Biblioteca
        </button>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white"
              style={{ color: meta.color }}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0b1020]">
                {meta.label}
              </h2>
              <p className="mt-0.5 text-[13.5px] text-[#55617c]">
                {content?.tagline}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={() => openImprove({ prompt: '', sector: meta.id })}
              className="bg-[#3e7aef] font-semibold text-white hover:bg-[#2f5fd0]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Melhorar meu prompt com este setor
            </Button>
            <Button
              variant="ghost"
              onClick={copyPlaybook}
              className="bg-white/70 text-[#0b1020] hover:bg-white"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar playbook
            </Button>
          </div>
        </div>

        {/* Card do playbook */}
        {content ? (
          <div className="shadow-warm mt-5 rounded-xl border border-[#e3e9f6] bg-white p-5">
            <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-[#0b1020]">
              O que um bom prompt de {meta.label} precisa
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {content.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-[13px] leading-snug text-[#55617c]"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: meta.color }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ===== Header da lista: contagem + busca + chips de tags ===== */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-[15px] font-semibold text-[#0b1020]">
          {itemsQuery.isLoading
            ? 'Carregando…'
            : `${filtered.length} prompt${filtered.length === 1 ? '' : 's'}`}
        </h3>
        <div className="relative w-full sm:ml-auto sm:w-[320px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b97b8]" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por título ou conteúdo…"
            className="h-10 w-full rounded-full border border-[#e3e9f6] bg-white pl-10 pr-9 text-sm text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
          />
          {term ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8b97b8] hover:text-[#0b1020]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <TagChip
            selected={activeTag === null}
            onClick={() => setActiveTag(null)}
            label="Todas"
          />
          {tags.map((t) => (
            <TagChip
              key={t}
              selected={activeTag === t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              label={t}
            />
          ))}
        </div>
      ) : null}

      {/* ===== Lista de prompts-semente (re-stagger 40ms ao trocar de setor) ===== */}
      <div key={meta.id} className="mt-4 flex flex-col gap-4">
        {itemsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[190px] rounded-xl bg-[#e3e9f6]/60" />
          ))
        ) : filtered.length === 0 ? (
          <div className="shadow-warm rounded-xl border border-[#e3e9f6] bg-white">
            <EmptyState
              image="/empty-search.svg"
              title={
                term
                  ? `Nada encontrado para "${term.trim()}"`
                  : 'Nada encontrado com esse filtro'
              }
              description="Tente outra palavra ou limpe a busca."
              primaryAction={{
                label: 'Limpar busca',
                icon: <X className="mr-2 h-4 w-4" />,
                onClick: clearSearch,
              }}
            />
          </div>
        ) : (
          filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(i, 12) * 0.04,
                ease: EASE,
              }}
            >
              <LibraryPromptCard
                item={item}
                saved={savedTitles.has(item.title.trim().toLowerCase())}
                saving={savingId === item.id}
                onSave={() => handleSave(item)}
                onOpenCopy={() => navigate('/app')}
              />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

function TagChip({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-[#3e7aef] bg-[#3e7aef] text-white'
          : 'border-[#e3e9f6] bg-white text-[#55617c] hover:border-[#3e7aef]/50',
      )}
    >
      {label}
    </button>
  )
}

/** Card de prompt da biblioteca: mono colapsado (96px + fade), copiar e salvar no vault. */
function LibraryPromptCard({
  item,
  saved,
  saving,
  onSave,
  onOpenCopy,
}: {
  item: LibraryItemData
  saved: boolean
  saving: boolean
  onSave: () => void
  onOpenCopy: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const itemTags = parseTags(item.tags)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopied(true)
      toastSuccess('Prompt copiado')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toastError('Não foi possível copiar automaticamente')
    }
  }

  return (
    <article className="shadow-warm rounded-xl border border-[#e3e9f6] bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="min-w-0 flex-1 truncate font-display text-[15.5px] font-semibold text-[#0b1020]">
          {item.title}
        </h4>
        {itemTags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-[#f5f7fc] px-2.5 py-1 text-[11px] font-medium text-[#55617c]"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Conteúdo mono colapsado: max-h 96px + fade; expande com accordion 250ms */}
      <div className="relative mt-3 rounded-md bg-[#f5f7fc] px-3 py-2">
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <pre className="whitespace-pre-wrap pb-1 font-mono text-[12.5px] leading-[1.65] text-[#55617c]">
            {item.content}
          </pre>
        </motion.div>
        {!expanded ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-md bg-gradient-to-t from-[#f5f7fc] to-transparent"
          />
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3e7aef] transition-colors hover:text-[#2f5fd0]"
      >
        {expanded ? 'Recolher' : 'Ver completo'}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-[250ms]',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* Rodapé: Copiar + Salvar no vault */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e3e9f6] pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-[#3e7aef] hover:bg-[#eaf0ff]"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-[#22a58a]" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>

        {saved ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenCopy}
            title="Abrir cópia na biblioteca"
            className="bg-[#22a58a]/10 font-semibold text-[#22a58a] hover:bg-[#22a58a]/20"
          >
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Salvo ✓
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="bg-[#3e7aef] font-semibold text-white hover:bg-[#2f5fd0]"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BookmarkPlus className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Salvando…' : 'Salvar na minha biblioteca'}
          </Button>
        )}
      </div>
    </article>
  )
}
