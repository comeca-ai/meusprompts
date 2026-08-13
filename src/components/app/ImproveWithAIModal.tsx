import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  Lightbulb,
  Loader2,
  RefreshCcw,
  Wand2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { improvePrompt, isDemoMode, type ImproveResult } from '@/lib/improvePrompt'
import { SECTOR_META } from '@/lib/vault'
import { toastSuccess } from './toasts'

export interface ImproveWithAIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Conteúdo atual do prompt (pode ser rascunho não salvo) */
  prompt: string
  /** Setor pré-selecionado (id de SECTOR_META) */
  initialSector?: string | null
  /** Contexto de prompt existente: aplica o resultado como nova versão source 'ai' */
  onApply?: (improved: string, sectorId: string, sectorLabel: string) => void
}

/** Modal "Melhorar com IA" reutilizado no vault, editor e biblioteca (app-design.md §4.5). */
export function ImproveWithAIModal({
  open,
  onOpenChange,
  prompt,
  initialSector,
  onApply,
}: ImproveWithAIModalProps) {
  const [sectorId, setSectorId] = useState<string | null>(initialSector ?? null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImproveResult | null>(null)
  const [copied, setCopied] = useState(false)
  const demo = isDemoMode()

  useEffect(() => {
    if (open) {
      setSectorId(initialSector ?? null)
      setResult(null)
      setError(null)
      setLoading(false)
      setCopied(false)
      setDraft('')
    }
  }, [open, initialSector])

  const effectivePrompt = prompt.trim() ? prompt : draft

  const sectorLabel = (id: string) =>
    SECTOR_META.find((s) => s.id === id)?.label ?? id

  const run = async () => {
    if (!sectorId || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await improvePrompt(effectivePrompt, sectorId)
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toastSuccess('Prompt copiado')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toastSuccess('Não foi possível copiar automaticamente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header ink */}
        <div className="flex items-center gap-3 bg-[#0b1020] px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3e7aef]/25">
            <Wand2 className="h-4 w-4 text-[#8fb2ff]" />
          </span>
          <DialogTitle className="font-display text-base font-semibold text-white">
            Melhorar com IA
          </DialogTitle>
          <span
            className={cn(
              'ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold',
              demo
                ? 'bg-[#f2a63b]/15 text-[#f2a63b]'
                : 'bg-[#eaf0ff] text-[#3e7aef]',
            )}
          >
            {demo ? 'Modo demonstração' : 'Melhoria por IA via OpenRouter'}
          </span>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Prompt atual */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#55617c]">
              Prompt atual
            </p>
            {prompt.trim() ? (
              <div className="mt-1.5 max-h-[120px] overflow-y-auto rounded-lg border border-[#e3e9f6] bg-[#f5f7fc] p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#0b1020]">
                {prompt}
              </div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Cole aqui o prompt que você quer melhorar…"
                rows={4}
                className="mt-1.5 max-h-[120px] w-full resize-none overflow-y-auto rounded-lg border border-[#e3e9f6] bg-[#f5f7fc] p-3 font-mono text-[12.5px] leading-relaxed text-[#0b1020] outline-none placeholder:text-[#8b97b8] focus:ring-2 focus:ring-[#3e7aef]"
              />
            )}
          </div>

          {/* Seletor de setor */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#55617c]">
              Setor do playbook
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SECTOR_META.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSectorId(s.id)
                    setResult(null)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    sectorId === s.id
                      ? 'border-transparent text-white'
                      : 'border-[#e3e9f6] bg-white text-[#55617c] hover:border-[#3e7aef]/50',
                  )}
                  style={
                    sectorId === s.id ? { backgroundColor: s.color } : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        sectorId === s.id ? '#ffffff' : s.color,
                    }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] text-[#d64545]">
              {error}
            </p>
          ) : null}

          {!result ? (
            <Button
              onClick={run}
              disabled={!sectorId || loading || !effectivePrompt.trim()}
              className="w-full bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando o playbook de {sectorId ? sectorLabel(sectorId) : ''}…
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Melhorar prompt
                </>
              )}
            </Button>
          ) : (
            <div className="animate-result-in space-y-4">
              {/* Resultado */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22a58a]">
                    Prompt melhorado
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(result.improved)}
                    className="flex items-center gap-1 text-xs font-medium text-[#3e7aef] hover:underline"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#22a58a]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copiar
                  </button>
                </div>
                <div className="mt-1.5 max-h-[180px] overflow-y-auto rounded-lg border border-[#22a58a]/30 bg-[#f5f7fc] p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#0b1020]">
                  {result.improved}
                </div>
              </div>

              {/* O que mudou */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#55617c]">
                  O que mudou e por quê
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {result.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#0b1020]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22a58a]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dica do setor */}
              <div className="flex items-start gap-2 rounded-lg bg-[#eaf0ff] px-3 py-2.5">
                <Lightbulb
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{
                    color: sectorId
                      ? (SECTOR_META.find((s) => s.id === sectorId)?.color ?? '#3e7aef')
                      : '#3e7aef',
                  }}
                />
                <p className="text-[13px] leading-relaxed text-[#0b1020]">
                  <span className="font-semibold">Dica do setor: </span>
                  {result.sectorTip}
                </p>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                {onApply ? (
                  <Button
                    onClick={() => {
                      if (sectorId) onApply(result.improved, sectorId, sectorLabel(sectorId))
                    }}
                    className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aplicar como nova versão
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => copy(result.improved)}
                  className="border-[#e3e9f6]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setResult(null)}
                  className="text-[#3e7aef] hover:bg-[#eaf0ff]"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Tentar outro setor
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
