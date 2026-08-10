import { ArrowDown, Check, Sparkles, Wand2 } from 'lucide-react'
import Reveal from '@/components/Reveal'

const CHECKS = [
  '1º uso livre, sem cadastro',
  'Playbooks de 6 setores',
  'Funciona no ChatGPT, Claude e Gemini',
]

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
        <div>
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Ferramenta gratuita · 6 setores
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-primary md:text-5xl">
              90% dos empresários não sabem que dá para pedir à IA para melhorar
              o próprio prompt.
              <span className="mt-3 block text-2xl font-medium text-[hsl(var(--coral-deep))] md:text-3xl">
                E quase ninguém sabe como um prompt do seu setor deve ser.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Cole seu prompt, escolha seu setor e receba uma versão
              profissional — com explicação do que mudou e por quê. Grátis.
            </p>
          </Reveal>

          <Reveal delay={270}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#ferramenta"
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--coral))] px-7 py-3.5 text-base font-semibold text-white shadow-warm transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--coral-deep))]"
              >
                <Wand2 className="h-5 w-5" />
                Melhorar meu prompt agora
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Ver como funciona
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <ul className="mt-8 space-y-2.5">
              {CHECKS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} scale>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border-4 border-white shadow-warm-lg md:rotate-1">
              <img
                src="/hero-workspace.png"
                alt="Pequeno empresário brasileiro usando IA no laptop, em um workspace acolhedor"
                className="h-auto w-full object-cover"
                width={1600}
                height={900}
              />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-warm md:-left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <Sparkles className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Prompt profissional
                </p>
                <p className="text-xs text-muted-foreground">em 30 segundos</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
