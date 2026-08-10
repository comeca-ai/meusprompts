import { useState } from 'react'
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  FlaskConical,
  Lightbulb,
  Loader2,
  MessageCircle,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Reveal from '@/components/Reveal'
import { SECTORS, DEFAULT_SECTOR, getSector } from '@/lib/sectors'
import { improvePrompt, isDemoMode } from '@/lib/improvePrompt'
import type { ImproveResult } from '@/lib/improvePrompt'
import {
  canUseFree,
  getLead,
  incrementUsage,
  saveLead,
  trackEvent,
} from '@/lib/tracker'
import { whatsappLink } from '@/lib/whatsapp'

const MIN_CHARS = 10

export default function PromptTool() {
  const [prompt, setPrompt] = useState('')
  const [sectorId, setSectorId] = useState(DEFAULT_SECTOR.id)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImproveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [gateError, setGateError] = useState<string | null>(null)
  const [leadSaved, setLeadSaved] = useState(getLead() !== null)

  const demo = isDemoMode()
  const sector = getSector(sectorId)
  const promptValid = prompt.trim().length >= MIN_CHARS

  async function runImprove() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await improvePrompt(prompt, sectorId)
      incrementUsage()
      trackEvent({ type: 'use', sector: sectorId })
      setResult(res)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Algo deu errado. Tente de novo em instantes.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit() {
    if (!promptValid || loading) return
    if (!canUseFree()) {
      setGateError(null)
      setGateOpen(true)
      return
    }
    void runImprove()
  }

  function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = leadName.trim()
    const email = leadEmail.trim()
    if (name.length < 2) {
      setGateError('Conta pra gente seu nome (pelo menos 2 letras).')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGateError('Esse email não parece válido. Confere aí?')
      return
    }
    saveLead({ name, email })
    trackEvent({ type: 'lead', sector: sectorId, name, email })
    setLeadSaved(true)
    setGateOpen(false)
    void runImprove()
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.improved)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result.improved
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="ferramenta" className="scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-primary md:text-4xl">
              Melhore meu prompt
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Cole o prompt que você usa hoje e escolha o setor do seu negócio.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-warm-lg md:p-8">
            {/* Selo de modo */}
            <div className="flex justify-center">
              {demo ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Modo demonstração — configure a chave OpenRouter para melhoria
                  por IA
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                  Melhoria por IA via OpenRouter
                </span>
              )}
            </div>

            {/* Textarea */}
            <div className="mt-6">
              <Label htmlFor="prompt-input" className="text-sm font-semibold text-foreground">
                Seu prompt atual
              </Label>
              <Textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Ex.: escreva um post para Instagram da minha clínica sobre limpeza de pele…"
                className="mt-2 resize-y border-input bg-background text-[15px] leading-relaxed focus-visible:ring-[hsl(var(--coral))]"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {prompt.trim().length > 0 && !promptValid
                    ? `Faltam ${MIN_CHARS - prompt.trim().length} caracteres`
                    : 'Quanto mais contexto, melhor o resultado'}
                </span>
                <span>{prompt.length} caracteres</span>
              </div>
            </div>

            {/* Chips de setor */}
            <div className="mt-6">
              <Label className="text-sm font-semibold text-foreground">
                Setor do seu negócio
              </Label>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {SECTORS.map((s) => {
                  const selected = s.id === sectorId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSectorId(s.id)}
                      aria-pressed={selected}
                      className={
                        selected
                          ? 'flex flex-col items-center gap-2 rounded-xl border-2 border-primary bg-primary px-3 py-4 text-primary-foreground shadow-warm transition-all'
                          : 'flex flex-col items-center gap-2 rounded-xl border-2 border-transparent bg-secondary/50 px-3 py-4 text-foreground transition-all hover:border-primary/40 hover:bg-secondary'
                      }
                    >
                      <s.icon className="h-5 w-5" />
                      <span className="text-center text-xs font-semibold leading-tight">
                        {s.label}
                      </span>
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Botão principal */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!promptValid || loading}
              className="mt-7 w-full rounded-full bg-[hsl(var(--coral))] py-6 text-base font-semibold text-white shadow-warm transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--coral-deep))] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Melhorando com o playbook de {sector.label}…
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Melhorar meu prompt
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {leadSaved || canUseFree()
                ? 'Sem cadastro no 1º uso. Seus prompts não ficam salvos.'
                : ''}
            </p>

            {/* Erro */}
            {error && (
              <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-result-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  className="border-red-300 text-red-800 hover:bg-red-100"
                >
                  Tentar de novo
                </Button>
              </div>
            )}

            {/* Resultado */}
            {result && (
              <div className="mt-8 animate-result-in rounded-2xl border border-primary/20 bg-secondary/50 p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-primary">
                    Seu prompt melhorado
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0 border-primary/30 text-primary hover:bg-secondary"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-sans text-[15px] leading-relaxed text-foreground">
                  {result.improved}
                </pre>

                <h4 className="mt-6 font-display text-lg font-semibold text-primary">
                  O que mudou e por quê
                </h4>
                <ul className="mt-3 space-y-2.5">
                  {result.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {change}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/8 p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--coral-deep))]" />
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-semibold">Dica do setor: </span>
                    {result.sectorTip}
                  </p>
                </div>

                {/* CTA pós-resultado */}
                <div className="mt-6 flex flex-col items-center gap-4 rounded-xl bg-primary p-6 text-center md:flex-row md:justify-between md:text-left">
                  <p className="font-display text-lg font-semibold leading-snug text-primary-foreground">
                    Quer a biblioteca completa do seu setor, implantada na sua
                    equipe?
                  </p>
                  <a
                    href={whatsappLink(sector.label)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-[#eaf0ff]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Quero saber no WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Email gate — a partir do 2º uso */}
      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">
              Desbloqueie usos ilimitados
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Deixe seu nome e email para continuar usando grátis — e receba o
              guia de prompts do setor {sector.label}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="gate-name">Seu nome</Label>
              <Input
                id="gate-name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="gate-email">Seu melhor email</Label>
              <Input
                id="gate-email"
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="voce@suaempresa.com.br"
                autoComplete="email"
                className="mt-1.5"
              />
            </div>
            {gateError && (
              <p className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {gateError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full rounded-full bg-[hsl(var(--coral))] py-5 font-semibold text-white hover:bg-[hsl(var(--coral-deep))]"
            >
              Liberar acesso grátis
            </Button>
            <button
              type="button"
              onClick={() => setGateOpen(false)}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Agora não
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Sem spam. Seus dados ficam com a gente, só para te enviar o guia.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
