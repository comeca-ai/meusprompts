import type { LucideIcon } from 'lucide-react'
import {
  Scale,
  Sparkles,
  HeartPulse,
  Calculator,
  Building2,
  ShoppingCart,
} from 'lucide-react'

/** Forma estrutural de um prompt do vault (espelha db/schema.ts `prompts`). */
export interface VaultPrompt {
  id: number
  title: string
  content: string
  category: string
  sector: string | null
  visibility: string
  isFavorite: boolean
  currentVersion: number
  createdAt: Date | string
  updatedAt: Date | string
}

/** Forma estrutural de uma versão de prompt (espelha `prompt_versions`). */
export interface VaultVersion {
  id: number
  promptId: number
  version: number
  title: string
  content: string
  changeNote: string | null
  source: string
  createdAt: Date | string
}

export interface VaultCategory {
  id: string
  label: string
  color: string
}

/** Categorias fixas do vault com cor de chip (app-design.md §1). */
export const VAULT_CATEGORIES: VaultCategory[] = [
  { id: 'Atendimento', label: 'Atendimento', color: '#3e7aef' },
  { id: 'Marketing & Conteúdo', label: 'Marketing & Conteúdo', color: '#e2688a' },
  { id: 'Vendas & Propostas', label: 'Vendas & Propostas', color: '#22a58a' },
  { id: 'Operações', label: 'Operações', color: '#f2a63b' },
  { id: 'Financeiro', label: 'Financeiro', color: '#e06a4a' },
  { id: 'RH & Gestão', label: 'RH & Gestão', color: '#7c6ff0' },
  { id: 'Pessoal', label: 'Pessoal', color: '#5aa9e6' },
  { id: 'Outros', label: 'Outros', color: '#8b97b8' },
]

export function getCategory(id: string | null | undefined): VaultCategory {
  return (
    VAULT_CATEGORIES.find((c) => c.id === id) ??
    VAULT_CATEGORIES[VAULT_CATEGORIES.length - 1]
  )
}

export interface SectorMeta {
  id: string
  label: string
  color: string
  icon: LucideIcon
}

/** Cores categoriais dos 6 setores (app-design.md §1) — ids casam com src/lib/sectors.ts. */
export const SECTOR_META: SectorMeta[] = [
  { id: 'juridico', label: 'Jurídico', color: '#3e7aef', icon: Scale },
  { id: 'estetica', label: 'Estética & Beleza', color: '#e2688a', icon: Sparkles },
  { id: 'saude', label: 'Saúde & Clínicas', color: '#22a58a', icon: HeartPulse },
  { id: 'contabilidade', label: 'Contabilidade', color: '#f2a63b', icon: Calculator },
  { id: 'imobiliario', label: 'Imobiliário', color: '#e06a4a', icon: Building2 },
  { id: 'ecommerce', label: 'E-commerce & Varejo', color: '#7c6ff0', icon: ShoppingCart },
]

export function getSectorMeta(id: string | null | undefined): SectorMeta | null {
  return SECTOR_META.find((s) => s.id === id) ?? null
}

/** Extrai variáveis {{...}} únicas do conteúdo, na ordem de aparição. */
export function extractVariables(content: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const re = /\{\{\s*([^{}\s][^{}]*?)\s*\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    const name = m[1]
    if (!seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

/** Tempo relativo curto em PT-BR ("agora", "há 2 dias", "há 3 semanas"). */
export function relTime(d: Date | string): string {
  const date = toDate(d)
  const diffMs = Date.now() - date.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return hours === 1 ? 'há 1 hora' : `há ${hours} horas`
  const days = Math.floor(hours / 24)
  if (days < 7) return days === 1 ? 'há 1 dia' : `há ${days} dias`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`
  const years = Math.floor(days / 365)
  return years === 1 ? 'há 1 ano' : `há ${years} anos`
}

const PT_DAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]
const PT_MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** Data por extenso: "quarta-feira, 13 de agosto". */
export function fullDatePt(d = new Date()): string {
  return `${PT_DAYS[d.getDay()]}, ${d.getDate()} de ${PT_MONTHS[d.getMonth()]}`
}

/** Quebra texto em partes para highlight do termo de busca. */
export function splitHighlight(
  text: string,
  term: string,
): { text: string; hit: boolean }[] {
  const t = term.trim()
  if (!t) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const needle = t.toLowerCase()
  const parts: { text: string; hit: boolean }[] = []
  let i = 0
  while (i < text.length) {
    const idx = lower.indexOf(needle, i)
    if (idx === -1) {
      parts.push({ text: text.slice(i), hit: false })
      break
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false })
    parts.push({ text: text.slice(idx, idx + needle.length), hit: true })
    i = idx + needle.length
  }
  return parts
}

/** Diff simples por linha (LCS) — usado no DiffModal. */
export type DiffLine = { text: string; type: 'same' | 'added' | 'removed' }

export function diffLines(
  oldText: string,
  newText: string,
): { left: DiffLine[]; right: DiffLine[] } {
  const a = oldText.split('\n')
  const b = newText.split('\n')
  const n = a.length
  const m = b.length
  // DP LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  )
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const left: DiffLine[] = []
  const right: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      left.push({ text: a[i], type: 'same' })
      right.push({ text: b[j], type: 'same' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      left.push({ text: a[i], type: 'removed' })
      i++
    } else {
      right.push({ text: b[j], type: 'added' })
      j++
    }
  }
  while (i < n) left.push({ text: a[i++], type: 'removed' })
  while (j < m) right.push({ text: b[j++], type: 'added' })
  return { left, right }
}
