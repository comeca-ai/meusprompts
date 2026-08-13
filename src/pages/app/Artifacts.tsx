import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Braces,
  Code2,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Maximize2,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Smartphone,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import {
  AppShell,
  EmptyState,
  toastError,
  toastSuccess,
  toastUndo,
} from '@/components/app'
import { cn } from '@/lib/utils'
import { relTime, type VaultPrompt } from '@/lib/vault'

/* ================= Tipos e constantes ================= */

/** Forma estrutural de um artefato (espelha db/schema.ts `artifacts`). */
export interface VaultArtifact {
  id: number
  title: string
  description: string | null
  type: string
  language: string | null
  code: string
  promptId: number | null
  isFavorite: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

type ArtifactType = 'html' | 'code' | 'text'
type TypeFilter = 'all' | ArtifactType
type SortId = 'recentes' | 'az' | 'favoritos'

const TYPE_META: Record<
  ArtifactType,
  { label: string; icon: typeof Globe; badgeClass: string }
> = {
  html: { label: 'HTML', icon: Globe, badgeClass: 'bg-[#eaf0ff] text-[#3e7aef]' },
  code: { label: 'Código', icon: Code2, badgeClass: 'bg-[#0b1020] text-[#8fb2ff]' },
  text: { label: 'Texto', icon: FileText, badgeClass: 'bg-[#e3e9f6] text-[#55617c]' },
}

const LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'JSX', 'Python', 'SQL', 'Texto puro']

const DEFAULT_LANGUAGE: Record<ArtifactType, string> = {
  html: 'HTML',
  code: 'JavaScript',
  text: 'Texto puro',
}

function typeOf(a: VaultArtifact): ArtifactType {
  return a.type === 'code' || a.type === 'text' ? a.type : 'html'
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
}

/* ================= Artefatos de exemplo (sugestão visual — nunca vão ao banco) ================= */

interface ExampleArtifact {
  title: string
  description: string
  code: string
}

const EXAMPLE_ARTIFACTS: ExampleArtifact[] = [
  {
    title: 'Landing de captura — consultoria',
    description:
      'Hero simples de página de captura com a paleta comeca.ai — pronto para adaptar.',
    code: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Consultoria — Diagnóstico gratuito</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f7fc; color: #0b1020; }
    .hero { max-width: 720px; margin: 0 auto; padding: 96px 24px; text-align: center; }
    .eyebrow { display: inline-block; background: #eaf0ff; color: #3e7aef; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; }
    h1 { font-size: 42px; line-height: 1.15; margin: 20px 0 16px; letter-spacing: -0.02em; }
    h1 span { color: #3e7aef; }
    p { font-size: 17px; line-height: 1.6; color: #55617c; max-width: 540px; margin: 0 auto 32px; }
    .cta { display: inline-block; background: #3e7aef; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 8px 24px rgba(62,122,239,.35); }
    .cta:hover { background: #2f5fd0; }
    .proof { margin-top: 28px; font-size: 13px; color: #8b97b8; }
  </style>
</head>
<body>
  <main class="hero">
    <span class="eyebrow">Diagnóstico gratuito</span>
    <h1>Sua empresa falando com <span>uma voz só</span> em todos os canais</h1>
    <p>Em 30 minutos, mostramos onde sua comunicação perde clientes e como a IA pode padronizar o atendimento sem perder o seu tom.</p>
    <a class="cta" href="#">Agendar meu diagnóstico</a>
    <p class="proof">Mais de 200 empresas já passaram pelo diagnóstico · Sem compromisso</p>
  </main>
</body>
</html>`,
  },
  {
    title: 'E-mail HTML de boas-vindas',
    description:
      'Tabela HTML com estilos inline — compatível com os principais clientes de e-mail.',
    code: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Bem-vindo!</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e9f6;">
          <tr>
            <td style="background-color:#0b1020;padding:28px 32px;">
              <span style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#e7edff;">c<span style="color:#8fb2ff;">&#8734;</span>meca.ai</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;font-family:Arial,sans-serif;">
              <h1 style="margin:0 0 12px;font-size:24px;color:#0b1020;">Bem-vindo(a) a bordo!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#55617c;">Seu acesso foi liberado. A partir de agora, a IA da sua empresa fala com uma voz s&oacute; — a sua.</p>
              <a href="#" style="display:inline-block;background-color:#3e7aef;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">Acessar minha conta</a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8b97b8;">D&uacute;vidas? Responda este e-mail — lemos tudo.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #e3e9f6;font-family:Arial,sans-serif;font-size:12px;color:#8b97b8;">comeca.ai · Voc&ecirc; recebeu este e-mail porque criou uma conta.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
]

/* ================= Helpers ================= */

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'artefato'
  )
}

function fileExtFor(a: VaultArtifact): string {
  const t = typeOf(a)
  if (t === 'html') return 'html'
  if (t === 'text') return 'txt'
  const lang = (a.language ?? '').toLowerCase()
  if (lang.includes('javascript')) return 'js'
  if (lang.includes('jsx')) return 'jsx'
  if (lang.includes('python')) return 'py'
  if (lang.includes('sql')) return 'sql'
  if (lang.includes('css')) return 'css'
  return 'txt'
}

function downloadArtifact(a: VaultArtifact) {
  const blob = new Blob([a.code], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(a.title)}.${fileExtFor(a)}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function openInNewTab(a: VaultArtifact) {
  const blob = new Blob([a.code], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function fullDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/** Debounce simples de valor (preview ao vivo do editor). */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Trava o scroll do body enquanto um overlay está aberto. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/* ================= Highlight leve de sintaxe (regex-based) ================= */

const LINE_TOKEN_RE =
  /(<!--[\s\S]*?-->|"[^"\n]*"|'[^'\n]*'|<\/?[a-zA-Z!][^>\n]*\/?>|\/\/[^\n]*)/g
const TAG_TOKEN_RE = /"[^"\n]*"|'[^'\n]*'|[a-zA-Z-][\w-]*(?=\s*=)/g

function renderTag(tag: string, key: string): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  TAG_TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_TOKEN_RE.exec(tag)) !== null) {
    if (m.index > last)
      out.push(
        <span key={k++} className="text-[#8fb2ff]">
          {tag.slice(last, m.index)}
        </span>,
      )
    const tok = m[0]
    if (tok.startsWith('"') || tok.startsWith("'"))
      out.push(
        <span key={k++} className="text-[#9fe8d0]">
          {tok}
        </span>,
      )
    else
      out.push(
        <span key={k++} className="text-[#c7d6ff]">
          {tok}
        </span>,
      )
    last = m.index + tok.length
  }
  if (last < tag.length)
    out.push(
      <span key={k++} className="text-[#8fb2ff]">
        {tag.slice(last)}
      </span>,
    )
  return <span key={key}>{out}</span>
}

function renderHighlightedLine(line: string, lineKey: number): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  LINE_TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINE_TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('<!--') || tok.startsWith('//'))
      out.push(
        <span key={k++} className="italic text-[#6b7694]">
          {tok}
        </span>,
      )
    else if (tok.startsWith('"') || tok.startsWith("'"))
      out.push(
        <span key={k++} className="text-[#9fe8d0]">
          {tok}
        </span>,
      )
    else out.push(renderTag(tok, `${lineKey}-${k++}`))
    last = m.index + tok.length
  }
  if (last < line.length) out.push(line.slice(last))
  if (out.length === 0) return ' '
  return out
}

/** Bloco de código ink com números de linha e highlight leve (app-artefatos.md §4). */
function CodeBlock({ code, className }: { code: string; className?: string }) {
  const lines = useMemo(() => code.split('\n'), [code])
  return (
    <div
      className={cn(
        'overflow-auto bg-[#0b1020] font-mono text-[13px] leading-[1.65]',
        className,
      )}
    >
      <pre className="min-w-max p-4">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-10 shrink-0 select-none pr-4 text-right text-[#3d4a6b]">
              {i + 1}
            </span>
            <code className="whitespace-pre text-[#dbe4ff]">
              {renderHighlightedLine(line, i)}
            </code>
          </div>
        ))}
      </pre>
    </div>
  )
}

/* ================= Página ================= */

export default function Artifacts() {
  return (
    <AppShell
      title="Artefatos"
      subtitle="HTML e código gerados por IA, com preview ao vivo"
    >
      <ArtifactsContent />
    </AppShell>
  )
}

/* ================= Conteúdo ================= */

interface FormSeed {
  title?: string
  description?: string
  type?: ArtifactType
  language?: string
  code?: string
  promptId?: number | null
}

interface FormValues {
  title: string
  description: string
  type: ArtifactType
  language: string
  code: string
  promptId: number | null
}

function ArtifactsContent() {
  const utils = trpc.useUtils()

  // ===== Dados =====
  const listQuery = trpc.vault.listArtifacts.useQuery({})
  const promptsQuery = trpc.vault.list.useQuery({})

  const artifacts = useMemo(
    () => (listQuery.data ?? []) as VaultArtifact[],
    [listQuery.data],
  )
  const prompts = useMemo(
    () => (promptsQuery.data ?? []) as VaultPrompt[],
    [promptsQuery.data],
  )
  const promptById = useMemo(() => {
    const map = new Map<number, VaultPrompt>()
    for (const p of prompts) map.set(p.id, p)
    return map
  }, [prompts])

  // ===== Filtros =====
  const [searchInput, setSearchInput] = useState('')
  const term = useDebouncedValue(searchInput.trim(), 250)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortId>('recentes')

  const typeCounts = useMemo(() => {
    const map = new Map<ArtifactType, number>()
    for (const a of artifacts) {
      const t = typeOf(a)
      map.set(t, (map.get(t) ?? 0) + 1)
    }
    return map
  }, [artifacts])

  const filtered = useMemo(() => {
    const needle = term.toLowerCase()
    const out = artifacts.filter((a) => {
      const t = typeOf(a)
      if (typeFilter !== 'all' && t !== typeFilter) return false
      if (
        needle &&
        !a.title.toLowerCase().includes(needle) &&
        !(a.description ?? '').toLowerCase().includes(needle) &&
        !a.code.toLowerCase().includes(needle)
      )
        return false
      return true
    })
    const sorted = [...out]
    if (sort === 'az')
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    else if (sort === 'favoritos')
      sorted.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))
    return sorted
  }, [artifacts, typeFilter, term, sort])

  const hasFilter = typeFilter !== 'all' || term.length > 0
  const clearFilters = () => {
    setTypeFilter('all')
    setSearchInput('')
  }

  // ===== Mutações =====
  const invalidate = () => {
    void utils.vault.listArtifacts.invalidate()
  }

  const createMut = trpc.vault.createArtifact.useMutation()
  const updateMut = trpc.vault.updateArtifact.useMutation()
  const deleteMut = trpc.vault.deleteArtifact.useMutation()

  // ===== Estado de UI =====
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = artifacts.find((a) => a.id === selectedId) ?? null
  const [formState, setFormState] = useState<{
    artifact: VaultArtifact | null
    seed: FormSeed | null
  } | null>(null)
  const [toDelete, setToDelete] = useState<VaultArtifact | null>(null)

  const openNew = (seed?: FormSeed) =>
    setFormState({ artifact: null, seed: seed ?? null })
  const openEdit = (a: VaultArtifact) => setFormState({ artifact: a, seed: null })

  // ===== Ações =====
  const handleCopy = async (a: VaultArtifact) => {
    const ok = await copyText(a.code)
    if (ok) toastSuccess('Código copiado')
    else toastError('Não foi possível copiar automaticamente')
  }

  const handleDownload = (a: VaultArtifact) => {
    downloadArtifact(a)
    toastSuccess(`Baixado ${slugify(a.title)}.${fileExtFor(a)}`)
  }

  const handleToggleFavorite = (a: VaultArtifact) => {
    updateMut.mutate(
      { id: a.id, isFavorite: !a.isFavorite },
      { onSuccess: invalidate },
    )
  }

  const handleDuplicate = (a: VaultArtifact) => {
    createMut.mutate(
      {
        title: `${a.title} (cópia)`,
        description: a.description ?? undefined,
        type: typeOf(a),
        language: a.language ?? undefined,
        code: a.code,
        promptId: a.promptId ?? undefined,
      },
      {
        onSuccess: () => {
          invalidate()
          toastSuccess('Artefato duplicado')
        },
      },
    )
  }

  const confirmDelete = () => {
    if (!toDelete) return
    const a = toDelete
    setToDelete(null)
    deleteMut.mutate(
      { id: a.id },
      {
        onSuccess: () => {
          invalidate()
          setSelectedId((cur) => (cur === a.id ? null : cur))
          toastUndo('Artefato excluído', () => {
            createMut.mutate(
              {
                title: a.title,
                description: a.description ?? undefined,
                type: typeOf(a),
                language: a.language ?? undefined,
                code: a.code,
                promptId: a.promptId ?? undefined,
              },
              {
                onSuccess: () => {
                  invalidate()
                  toastSuccess('Artefato restaurado')
                },
              },
            )
          })
        },
      },
    )
  }

  const handleSave = (values: FormValues) => {
    const editing = formState?.artifact ?? null
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      type: values.type,
      language: values.language,
      code: values.code,
    }
    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...payload, promptId: values.promptId },
        {
          onSuccess: () => {
            invalidate()
            setFormState(null)
            toastSuccess('Artefato salvo')
          },
          onError: () => toastError('Não foi possível salvar o artefato'),
        },
      )
    } else {
      createMut.mutate(
        { ...payload, promptId: values.promptId ?? undefined },
        {
          onSuccess: () => {
            invalidate()
            setFormState(null)
            toastSuccess('Artefato salvo')
          },
          onError: () => toastError('Não foi possível salvar o artefato'),
        },
      )
    }
  }

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
            Artefatos
          </motion.p>
          <motion.h2
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.07 }}
            className="mt-1 font-display text-[26px] font-bold tracking-tight text-[#0b1020]"
          >
            Artefatos &amp; HTML gerados
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.14 }}
            className="mt-1 max-w-xl text-sm text-[#55617c]"
          >
            Guarde o que a IA gerou — landing pages, componentes, e-mails — com
            preview ao vivo e código sempre à mão.
          </motion.p>
        </div>
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.21 }}
        >
          <Button
            onClick={() => openNew()}
            className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo artefato
          </Button>
        </motion.div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className="sticky top-[60px] z-20 -mx-2 mt-6 bg-[#f5f7fc]/90 px-2 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs de tipo (segmented pills com contagem) — scroll horizontal no mobile */}
          <div className="-mx-1 flex max-w-full overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex shrink-0 rounded-full border border-[#e3e9f6] bg-white p-1">
            {(
              [
                { id: 'all', label: 'Todos', icon: null, count: artifacts.length },
                { id: 'html', label: 'HTML', icon: Globe, count: typeCounts.get('html') ?? 0 },
                { id: 'code', label: 'Código', icon: Code2, count: typeCounts.get('code') ?? 0 },
                { id: 'text', label: 'Texto', icon: FileText, count: typeCounts.get('text') ?? 0 },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                  typeFilter === t.id
                    ? 'bg-[#eaf0ff] text-[#3e7aef]'
                    : 'text-[#55617c] hover:text-[#0b1020]',
                )}
              >
                {t.icon ? <t.icon className="h-3.5 w-3.5" /> : null}
                {t.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10.5px] font-semibold',
                    typeFilter === t.id
                      ? 'bg-[#3e7aef]/10 text-[#3e7aef]'
                      : 'bg-[#f5f7fc] text-[#8b97b8]',
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
            </div>
          </div>

          {/* Busca */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b97b8]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar artefatos…"
              className="h-10 w-full rounded-full border border-[#e3e9f6] bg-white pl-10 pr-9 text-sm text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8b97b8] hover:text-[#0b1020]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Ordenação */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
            <SelectTrigger className="h-10 w-[190px] rounded-full border-[#e3e9f6] bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
              <SelectItem value="favoritos">Favoritos primeiro</SelectItem>
            </SelectContent>
          </Select>

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

      {/* ===== Grid ===== */}
      <div className="pt-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-[#e3e9f6] bg-white"
              >
                <Skeleton className="aspect-[16/10] w-full rounded-none bg-[#e3e9f6]/60" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-24 bg-[#e3e9f6]/60" />
                  <Skeleton className="h-4 w-3/4 bg-[#e3e9f6]/60" />
                  <Skeleton className="h-3 w-full bg-[#e3e9f6]/60" />
                </div>
              </div>
            ))}
          </div>
        ) : artifacts.length === 0 ? (
          <>
            <EmptyState
              image="/empty-artifacts.svg"
              title="Nenhum artefato por aqui"
              description="Da próxima vez que o Claude ou o ChatGPT gerar um HTML útil, guarde aqui — com preview e tudo."
              primaryAction={{
                label: 'Criar primeiro artefato',
                icon: <Plus className="mr-2 h-4 w-4" />,
                onClick: () => openNew(),
              }}
            />
            {/* Sugestões visuais — pré-preenchem o formulário, não vão ao banco */}
            <div className="mx-auto mt-2 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {EXAMPLE_ARTIFACTS.map((ex, i) => (
                <motion.button
                  key={ex.title}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.15 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() =>
                    openNew({
                      title: ex.title,
                      description: ex.description,
                      type: 'html',
                      language: 'HTML',
                      code: ex.code,
                    })
                  }
                  className="group overflow-hidden rounded-xl border border-dashed border-[#c9d6f2] bg-white text-left shadow-warm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3e7aef]/50 hover:shadow-warm-lg"
                >
                  <div
                    className="relative aspect-[16/8] overflow-hidden border-b border-[#e3e9f6]"
                    style={{
                      backgroundColor: '#f5f7fc',
                      backgroundImage:
                        'radial-gradient(#e3e9f6 1px, transparent 1px)',
                      backgroundSize: '12px 12px',
                    }}
                  >
                    <iframe
                      title={`Exemplo: ${ex.title}`}
                      srcDoc={ex.code}
                      sandbox="allow-same-origin"
                      loading="lazy"
                      tabIndex={-1}
                      className="pointer-events-none border-0"
                      style={{
                        width: '250%',
                        height: '250%',
                        transform: 'scale(0.4)',
                        transformOrigin: 'top left',
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <span className="rounded-full bg-[#eaf0ff] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#3e7aef]">
                      Exemplo
                    </span>
                    <p className="mt-2 truncate font-display text-[14.5px] font-semibold text-[#0b1020]">
                      {ex.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-[#55617c]">
                      {ex.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#3e7aef]">
                      <Plus className="h-3.5 w-3.5" />
                      Usar este exemplo
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
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
            className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((a, i) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i, 12) * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ArtifactCard
                    artifact={a}
                    promptTitle={
                      a.promptId ? promptById.get(a.promptId)?.title ?? null : null
                    }
                    onOpen={() => setSelectedId(a.id)}
                    onCopy={() => void handleCopy(a)}
                    onDownload={() => handleDownload(a)}
                    onToggleFavorite={() => handleToggleFavorite(a)}
                    onEdit={() => openEdit(a)}
                    onDuplicate={() => handleDuplicate(a)}
                    onDelete={() => setToDelete(a)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ===== Drawer de detalhe ===== */}
      <ArtifactDrawer
        artifact={selected}
        prompt={selected?.promptId ? promptById.get(selected.promptId) ?? null : null}
        onClose={() => setSelectedId(null)}
        onCopy={() => selected && void handleCopy(selected)}
        onDownload={() => selected && handleDownload(selected)}
        onOpenNewTab={() => selected && openInNewTab(selected)}
        onEdit={() => {
          if (selected) {
            setSelectedId(null)
            openEdit(selected)
          }
        }}
        onDuplicate={() => selected && handleDuplicate(selected)}
        onDelete={() => {
          if (selected) setToDelete(selected)
        }}
      />

      {/* ===== Dialog criar/editar ===== */}
      <ArtifactFormDialog
        state={formState}
        prompts={prompts}
        saving={createMut.isPending || updateMut.isPending}
        onClose={() => setFormState(null)}
        onSave={handleSave}
      />

      {/* ===== Confirmação de exclusão ===== */}
      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artefato?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.{' '}
              {toDelete ? `“${toDelete.title}” será removido dos seus artefatos.` : ''}
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

/* ================= Card da grid ================= */

interface ArtifactCardProps {
  artifact: VaultArtifact
  promptTitle: string | null
  onOpen: () => void
  onCopy: () => void
  onDownload: () => void
  onToggleFavorite: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function ArtifactCard({
  artifact,
  promptTitle,
  onOpen,
  onCopy,
  onDownload,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}: ArtifactCardProps) {
  const [favPop, setFavPop] = useState(0)
  const t = typeOf(artifact)
  const meta = TYPE_META[t]
  const TypeIcon = meta.icon

  const codeLines = useMemo(
    () => artifact.code.split('\n').slice(0, 6).join('\n'),
    [artifact.code],
  )

  return (
    <div
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#e3e9f6] bg-white shadow-warm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3e7aef]/40 hover:shadow-warm-lg"
    >
      {/* ===== Área de preview ===== */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[#e3e9f6]">
        {t === 'html' ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: '#f5f7fc',
                backgroundImage: 'radial-gradient(#e3e9f6 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            <iframe
              title={`Preview de ${artifact.title}`}
              srcDoc={artifact.code}
              sandbox="allow-same-origin"
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none relative border-0"
              style={{
                width: '222.22%',
                height: '222.22%',
                transform: 'scale(0.45)',
                transformOrigin: 'top left',
              }}
            />
            {/* Overlay hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b1020]/0 transition-colors duration-150 group-hover:bg-[#0b1020]/25">
              <span className="flex scale-95 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#0b1020] opacity-0 shadow-warm-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5 text-[#3e7aef]" />
                Abrir preview
              </span>
            </div>
          </>
        ) : t === 'code' ? (
          <div className="flex h-full flex-col bg-[#0b1020]">
            <div className="flex items-center gap-1.5 border-b border-[#232c47] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e2688a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f2a63b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22a58a]" />
              <span className="ml-2 font-mono text-[10.5px] uppercase tracking-wide text-[#8b97b8]">
                {artifact.language ?? 'code'}
              </span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden p-3">
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-[1.6] text-[#dbe4ff]">
                {codeLines}
              </pre>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0b1020] to-transparent" />
            </div>
          </div>
        ) : (
          <div className="relative h-full bg-[#f5f7fc] p-5">
            <span
              aria-hidden
              className="absolute left-3 top-0 font-display text-[64px] leading-none text-[#8fb2ff]"
            >
              “
            </span>
            <p className="line-clamp-4 pl-7 pt-4 text-[13px] italic leading-relaxed text-[#55617c]">
              {artifact.code}
            </p>
          </div>
        )}
      </div>

      {/* ===== Corpo ===== */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              meta.badgeClass,
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {meta.label}
          </span>
          {artifact.language && typeOf(artifact) !== 'text' ? (
            <span className="rounded-full border border-[#e3e9f6] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-[#8b97b8]">
              {artifact.language}
            </span>
          ) : null}
          <motion.span
            key={favPop}
            animate={favPop > 0 ? { scale: [1, 1.35, 1] } : undefined}
            transition={{ duration: 0.25 }}
            className="ml-auto inline-flex"
          >
            <button
              type="button"
              aria-label={
                artifact.isFavorite ? 'Remover dos favoritos' : 'Favoritar'
              }
              onClick={(e) => {
                e.stopPropagation()
                setFavPop((n) => n + 1)
                onToggleFavorite()
              }}
              className="rounded-md p-1 transition-colors hover:bg-[#f5f7fc]"
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-colors',
                  artifact.isFavorite
                    ? 'fill-[#f2a63b] text-[#f2a63b]'
                    : 'text-[#8b97b8]',
                )}
              />
            </button>
          </motion.span>
        </div>

        <h3 className="mt-2.5 truncate font-display text-[15.5px] font-semibold text-[#0b1020]">
          {artifact.title}
        </h3>
        {artifact.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#55617c]">
            {artifact.description}
          </p>
        ) : null}

        {/* Rodapé */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="shrink-0 text-[11px] text-[#8b97b8]">
            {relTime(artifact.updatedAt)}
          </span>
          {promptTitle && artifact.promptId ? (
            <Link
              to={`/app/prompts/${artifact.promptId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex min-w-0 items-center gap-1 rounded-full bg-[#eaf0ff] px-2 py-0.5 text-[11px] font-medium text-[#3e7aef] transition-colors hover:bg-[#dbe7ff]"
            >
              <Braces className="h-3 w-3 shrink-0" />
              <span className="truncate">Feito com: {promptTitle}</span>
            </Link>
          ) : null}
          <span
            className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-all duration-150 [transform:translateY(8px)] group-hover:opacity-100 group-hover:[transform:translateY(0)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Copiar código"
              title="Copiar código"
              onClick={onCopy}
              className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Baixar arquivo"
              title="Baixar arquivo"
              onClick={onDownload}
              className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
            >
              <Download className="h-4 w-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais ações"
                  className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="cursor-pointer text-[#d64545] focus:text-[#d64545]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================= Drawer de detalhe ================= */

type DrawerTab = 'preview' | 'codigo' | 'detalhes'

interface ArtifactDrawerProps {
  artifact: VaultArtifact | null
  prompt: VaultPrompt | null
  onClose: () => void
  onCopy: () => void
  onDownload: () => void
  onOpenNewTab: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function ArtifactDrawer({
  artifact,
  prompt,
  onClose,
  onCopy,
  onDownload,
  onOpenNewTab,
  onEdit,
  onDuplicate,
  onDelete,
}: ArtifactDrawerProps) {
  const isHtml = artifact ? typeOf(artifact) === 'html' : false
  const [tab, setTab] = useState<DrawerTab>('codigo')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const [frameLoaded, setFrameLoaded] = useState(false)

  // Reseta tabs ao trocar de artefato
  useEffect(() => {
    setTab(isHtml ? 'preview' : 'codigo')
    setViewport('desktop')
    setReloadKey(0)
    setFrameLoaded(false)
  }, [artifact?.id, isHtml])

  useBodyScrollLock(artifact !== null)

  // Esc fecha
  useEffect(() => {
    if (!artifact) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [artifact, onClose])

  const meta = artifact ? TYPE_META[typeOf(artifact)] : null
  const tabs: { id: DrawerTab; label: string }[] = [
    ...(isHtml ? [{ id: 'preview' as DrawerTab, label: 'Preview' }] : []),
    { id: 'codigo', label: 'Código' },
    { id: 'detalhes', label: 'Detalhes' },
  ]

  return (
    <AnimatePresence>
      {artifact && meta ? (
        <>
          <motion.div
            key="artifact-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#0b1020]/60 backdrop-blur-[2px]"
          />
          <motion.aside
            key="artifact-drawer"
            role="dialog"
            aria-label={`Detalhes do artefato ${artifact.title}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(920px,94vw)] flex-col bg-white"
            style={{ boxShadow: '0 8px 32px rgb(3 6 18 / 0.5)' }}
          >
            {/* Header ink */}
            <div className="shrink-0 bg-[#0b1020] p-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-[#131a30] px-2.5 py-1 text-[11px] font-semibold text-[#8fb2ff]">
                  <meta.icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-white">
                  {artifact.title}
                </h3>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onCopy}
                    className="flex items-center gap-1.5 rounded-full bg-[#131a30] px-3 py-1.5 text-[12px] font-semibold text-[#8fb2ff] transition-colors hover:bg-[#232c47]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copiar código</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDownload}
                    className="flex items-center gap-1.5 rounded-full bg-[#131a30] px-3 py-1.5 text-[12px] font-semibold text-[#e7edff] transition-colors hover:bg-[#232c47]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      Baixar .{fileExtFor(artifact)}
                    </span>
                  </button>
                  {isHtml ? (
                    <button
                      type="button"
                      aria-label="Abrir em nova aba"
                      title="Abrir em nova aba"
                      onClick={onOpenNewTab}
                      className="rounded-full bg-[#131a30] p-2 text-[#e7edff] transition-colors hover:bg-[#232c47]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Fechar"
                    onClick={onClose}
                    className="rounded-full bg-[#131a30] p-2 text-[#8b97b8] transition-colors hover:bg-[#232c47] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {artifact.description ? (
                <p className="mt-1.5 truncate text-[12.5px] text-[#8b97b8]">
                  {artifact.description}
                </p>
              ) : null}
            </div>

            {/* Tabs com underline animado */}
            <div className="flex shrink-0 gap-1 border-b border-[#e3e9f6] px-4">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative px-3 py-2.5 text-[13px] font-medium transition-colors',
                    tab === t.id
                      ? 'text-[#3e7aef]'
                      : 'text-[#55617c] hover:text-[#0b1020]',
                  )}
                >
                  {t.label}
                  {tab === t.id ? (
                    <motion.span
                      layoutId="artifact-tab-underline"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#3e7aef]"
                    />
                  ) : null}
                </button>
              ))}
            </div>

            {/* Corpo */}
            <div className="min-h-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {tab === 'preview' && isHtml ? (
                    <div className="flex h-full flex-col">
                      {/* Toolbar mini do preview */}
                      <div className="flex shrink-0 items-center gap-2 border-b border-[#e3e9f6] bg-[#f5f7fc] px-4 py-2">
                        <div className="flex rounded-full border border-[#e3e9f6] bg-white p-0.5">
                          {(
                            [
                              { id: 'desktop', icon: Monitor, label: 'Desktop' },
                              { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                            ] as const
                          ).map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              aria-label={v.label}
                              title={v.label}
                              onClick={() => setViewport(v.id)}
                              className={cn(
                                'rounded-full p-1.5 transition-colors',
                                viewport === v.id
                                  ? 'bg-[#eaf0ff] text-[#3e7aef]'
                                  : 'text-[#8b97b8] hover:text-[#55617c]',
                              )}
                            >
                              <v.icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          aria-label="Recarregar preview"
                          title="Recarregar preview"
                          onClick={() => {
                            setFrameLoaded(false)
                            setReloadKey((k) => k + 1)
                          }}
                          className="rounded-full border border-[#e3e9f6] bg-white p-1.5 text-[#8b97b8] transition-colors hover:text-[#3e7aef]"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <span className="ml-auto hidden text-[11px] text-[#8b97b8] sm:block">
                          Sandbox — scripts desativados
                        </span>
                      </div>
                      {/* Palco do iframe */}
                      <div className="flex min-h-0 flex-1 justify-center bg-[#f5f7fc] p-4">
                        <motion.div
                          animate={{ width: viewport === 'mobile' ? 390 : '100%' }}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            'h-full max-w-full overflow-hidden bg-white',
                            viewport === 'mobile' &&
                              'rounded-xl border border-[#232c47] shadow-warm-lg',
                          )}
                        >
                          <motion.iframe
                            key={reloadKey}
                            title={`Preview de ${artifact.title}`}
                            srcDoc={artifact.code}
                            sandbox="allow-same-origin"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: frameLoaded ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            onLoad={() => setFrameLoaded(true)}
                            className="h-full w-full border-0 bg-white"
                          />
                        </motion.div>
                      </div>
                    </div>
                  ) : tab === 'codigo' ? (
                    <div className="relative h-full bg-[#0b1020]">
                      <button
                        type="button"
                        onClick={onCopy}
                        className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-[#131a30] px-3 py-1.5 text-[12px] font-semibold text-[#8fb2ff] shadow-lg transition-colors hover:bg-[#232c47]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </button>
                      <CodeBlock code={artifact.code} className="h-full" />
                    </div>
                  ) : (
                    /* ===== Detalhes ===== */
                    <div className="h-full overflow-auto p-6">
                      <dl className="grid max-w-lg grid-cols-1 gap-4">
                        {[
                          { label: 'Criado em', value: fullDate(artifact.createdAt) },
                          {
                            label: 'Atualizado em',
                            value: `${fullDate(artifact.updatedAt)} (${relTime(artifact.updatedAt)})`,
                          },
                          { label: 'Tipo', value: meta.label },
                          {
                            label: 'Linguagem',
                            value: artifact.language ?? '—',
                          },
                          {
                            label: 'Tamanho',
                            value: `${artifact.code.length.toLocaleString('pt-BR')} caracteres`,
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-baseline justify-between gap-4 border-b border-[#e3e9f6] pb-3"
                          >
                            <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                              {row.label}
                            </dt>
                            <dd className="text-right text-[13.5px] text-[#0b1020]">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                        <div className="flex items-baseline justify-between gap-4 border-b border-[#e3e9f6] pb-3">
                          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                            Prompt de origem
                          </dt>
                          <dd className="text-right text-[13.5px]">
                            {prompt && artifact.promptId ? (
                              <Link
                                to={`/app/prompts/${artifact.promptId}`}
                                className="inline-flex items-center gap-1.5 font-medium text-[#3e7aef] hover:underline"
                              >
                                <Braces className="h-3.5 w-3.5" />
                                {prompt.title}
                              </Link>
                            ) : (
                              <span className="text-[#8b97b8]">Nenhum</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button
                          onClick={onEdit}
                          className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={onDuplicate}
                          className="text-[#3e7aef] hover:bg-[#eaf0ff]"
                        >
                          <CopyPlus className="mr-2 h-4 w-4" />
                          Duplicar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={onDelete}
                          className="text-[#d64545] hover:bg-[#fdecec]"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

/* ================= Dialog criar / editar ================= */

interface ArtifactFormDialogProps {
  state: { artifact: VaultArtifact | null; seed: FormSeed | null } | null
  prompts: VaultPrompt[]
  saving: boolean
  onClose: () => void
  onSave: (values: FormValues) => void
}

const CODE_PLACEHOLDER = '<!-- cole aqui o HTML que a IA gerou -->'

function ArtifactFormDialog({
  state,
  prompts,
  saving,
  onClose,
  onSave,
}: ArtifactFormDialogProps) {
  const open = state !== null
  const editing = state?.artifact ?? null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ArtifactType>('html')
  const [language, setLanguage] = useState('HTML')
  const [code, setCode] = useState('')
  const [promptId, setPromptId] = useState<number | null>(null)
  const [errors, setErrors] = useState<{ title?: string; code?: string }>({})
  const [mobilePane, setMobilePane] = useState<'code' | 'preview'>('code')

  // Inicializa o form ao abrir
  useEffect(() => {
    if (!state) return
    const a = state.artifact
    const s = state.seed
    setTitle(a?.title ?? s?.title ?? '')
    setDescription(a?.description ?? s?.description ?? '')
    const t = a ? typeOf(a) : (s?.type ?? 'html')
    setType(t)
    setLanguage(a?.language ?? s?.language ?? DEFAULT_LANGUAGE[t])
    setCode(a?.code ?? s?.code ?? '')
    setPromptId(a?.promptId ?? s?.promptId ?? null)
    setErrors({})
    setMobilePane('code')
  }, [state])

  useBodyScrollLock(open)

  // Esc fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const previewCode = useDebouncedValue(code, 500)
  const isHtml = type === 'html'

  const changeType = (t: ArtifactType) => {
    setType(t)
    // Ajusta a linguagem default quando o tipo muda e a atual não combina
    if (t === 'html' && language !== 'HTML') setLanguage('HTML')
    if (t === 'text') setLanguage('Texto puro')
    if (t === 'code' && (language === 'HTML' || language === 'Texto puro'))
      setLanguage('JavaScript')
  }

  const submit = () => {
    const errs: typeof errors = {}
    if (!title.trim()) errs.title = 'Dê um título ao artefato.'
    if (!code.trim()) errs.code = 'Cole o código ou texto gerado pela IA.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSave({ title, description, type, language, code, promptId })
  }

  const editorPane = (
    <>
      <label
        htmlFor="artifact-code"
        className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]"
      >
        {type === 'text' ? 'Texto' : 'Código'}
      </label>
      <textarea
        id="artifact-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={type === 'html' ? CODE_PLACEHOLDER : 'Cole aqui o que a IA gerou…'}
        spellCheck={false}
        className="h-[300px] w-full flex-1 resize-none rounded-lg bg-[#0b1020] p-4 font-mono text-[13.5px] leading-[1.65] text-[#dbe4ff] outline-none transition-shadow placeholder:text-[#3d4a6b] focus:ring-2 focus:ring-[#3e7aef]/40"
      />
      {errors.code ? (
        <p className="mt-1.5 text-[12px] font-medium text-[#d64545]">{errors.code}</p>
      ) : null}
    </>
  )

  const previewPane = isHtml ? (
    <>
      <span className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
        Preview ao vivo
      </span>
      <div
        className="h-[300px] flex-1 overflow-hidden rounded-lg border border-[#e3e9f6]"
        style={{
          backgroundColor: '#f5f7fc',
          backgroundImage: 'radial-gradient(#e3e9f6 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {previewCode.trim() ? (
          <iframe
            title="Preview ao vivo do artefato"
            srcDoc={previewCode}
            sandbox="allow-same-origin"
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-[12.5px] text-[#8b97b8]">
            O preview aparece aqui assim que você colar o HTML.
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <span className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
        Preview
      </span>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#e3e9f6] bg-[#f5f7fc] p-6 text-center text-[12.5px] text-[#8b97b8]">
        Preview ao vivo disponível para artefatos do tipo HTML.
      </div>
    </>
  )

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b1020]/60 backdrop-blur-[2px]"
          />
          <motion.div
            key="form-dialog"
            role="dialog"
            aria-label={editing ? 'Editar artefato' : 'Novo artefato'}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-warm-lg"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#e3e9f6] px-6 py-4">
              <h3 className="font-display text-[17px] font-semibold text-[#0b1020]">
                {editing ? 'Editar artefato' : 'Novo artefato'}
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="rounded-md p-1.5 text-[#8b97b8] transition-colors hover:bg-[#f5f7fc] hover:text-[#0b1020]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corpo */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="artifact-title"
                    className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]"
                  >
                    Título
                  </label>
                  <input
                    id="artifact-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex.: Landing de captura — Black Friday"
                    className="h-10 w-full rounded-lg border border-[#e3e9f6] bg-white px-3 text-sm text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
                  />
                  {errors.title ? (
                    <p className="mt-1.5 text-[12px] font-medium text-[#d64545]">
                      {errors.title}
                    </p>
                  ) : null}
                </div>

                <div>
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                    Tipo
                  </span>
                  <div className="flex rounded-full border border-[#e3e9f6] bg-white p-1">
                    {(
                      [
                        { id: 'html', label: 'HTML', icon: Globe },
                        { id: 'code', label: 'Código', icon: Code2 },
                        { id: 'text', label: 'Texto', icon: FileText },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => changeType(t.id)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[12px] font-medium transition-colors',
                          type === t.id
                            ? 'bg-[#eaf0ff] text-[#3e7aef]'
                            : 'text-[#55617c] hover:text-[#0b1020]',
                        )}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                    Linguagem
                  </span>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#e3e9f6] bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="artifact-description"
                    className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]"
                  >
                    Descrição <span className="normal-case text-[#8b97b8]">(opcional)</span>
                  </label>
                  <input
                    id="artifact-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Para que serve este artefato?"
                    maxLength={500}
                    className="h-10 w-full rounded-lg border border-[#e3e9f6] bg-white px-3 text-sm text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                    Vincular a um prompt{' '}
                    <span className="normal-case text-[#8b97b8]">(opcional)</span>
                  </span>
                  <Select
                    value={promptId ? String(promptId) : 'none'}
                    onValueChange={(v) =>
                      setPromptId(v === 'none' ? null : Number(v))
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#e3e9f6] bg-white text-sm">
                      <SelectValue placeholder="De onde este artefato nasceu?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum prompt</SelectItem>
                      {prompts.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11.5px] text-[#8b97b8]">
                    De onde este artefato nasceu — o prompt que gerou esse resultado.
                  </p>
                </div>
              </div>

              {/* Toggle mobile Código/Preview */}
              {isHtml ? (
                <div className="mt-5 flex rounded-full border border-[#e3e9f6] bg-white p-1 md:hidden">
                  {(
                    [
                      { id: 'code', label: 'Código' },
                      { id: 'preview', label: 'Preview' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMobilePane(p.id)}
                      className={cn(
                        'flex-1 rounded-full px-2 py-1.5 text-[12px] font-medium transition-colors',
                        mobilePane === p.id
                          ? 'bg-[#eaf0ff] text-[#3e7aef]'
                          : 'text-[#55617c]',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Split código + preview (mobile: alterna pelos tabs acima) */}
              <div className="mt-4 flex flex-col gap-4 md:flex-row">
                <div
                  className={cn(
                    'min-h-0 flex-1 flex-col',
                    isHtml && mobilePane === 'preview' ? 'hidden md:flex' : 'flex',
                  )}
                >
                  {editorPane}
                </div>
                <div
                  className={cn(
                    'min-h-0 flex-1 flex-col',
                    isHtml
                      ? mobilePane === 'preview'
                        ? 'flex'
                        : 'hidden md:flex'
                      : 'hidden md:flex',
                  )}
                >
                  {previewPane}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e3e9f6] px-6 py-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-[#55617c] hover:bg-[#f5f7fc]"
              >
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={saving}
                className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editing ? 'Salvar alterações' : 'Salvar artefato'}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
