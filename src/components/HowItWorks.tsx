import { ClipboardPaste, LayoutGrid, Sparkles } from 'lucide-react'
import Reveal from '@/components/Reveal'

const STEPS = [
  {
    number: '01',
    icon: ClipboardPaste,
    title: 'Cole seu prompt',
    text: 'Aquele que você já usa — ou tenta usar — no ChatGPT, Claude ou Gemini.',
  },
  {
    number: '02',
    icon: LayoutGrid,
    title: 'Escolha seu setor',
    text: 'Jurídico, Estética, Saúde, Contabilidade, Imobiliário ou E-commerce.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Receba a versão profissional',
    text: 'Prompt reescrito + explicação do que mudou e uma dica prática do setor.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold text-primary md:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Três passos, sem cadastro para começar, sem jargão de tecnologia.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 120}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-warm">
                <span className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-7xl font-bold text-secondary">
                  {step.number}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:-translate-y-1">
                  <step.icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 font-display text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
