import { Check, MessageCircle } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { whatsappLink } from '@/lib/whatsapp'

const BENEFITS = [
  '50+ prompts profissionais do seu setor, prontos para copiar',
  'Implantação assistida com a sua equipe',
  'Treinamento de 1h para usar IA no dia a dia',
  'Atualizações mensais da biblioteca',
]

export default function OfferSection() {
  return (
    <section id="oferta" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
        <Reveal>
          <div className="rounded-3xl bg-[#0b1020] px-6 py-12 text-white md:px-14 md:py-16">
            <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8fb2ff]">
                  Próximo passo
                </span>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight md:text-4xl">
                  Quer a biblioteca completa do seu setor, implantada na sua
                  equipe?
                </h2>
                <ul className="mt-7 space-y-3">
                  {BENEFITS.map((b, i) => (
                    <Reveal key={b} delay={i * 90}>
                      <li className="flex items-start gap-3 text-[15px] leading-relaxed text-primary-foreground/90">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <Check className="h-3 w-3" />
                        </span>
                        {b}
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-white/10 p-7 text-center backdrop-blur-sm">
                <p className="text-sm text-primary-foreground/80">
                  Investimento único
                </p>
                <p className="mt-1 font-display text-5xl font-bold">R$497</p>
                <p className="mt-3 text-xs leading-relaxed text-primary-foreground/70">
                  Vagas de implantação limitadas a 10 empresas por mês.
                </p>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--coral))] px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--coral-deep))]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chamar no WhatsApp
                </a>
                <p className="mt-3 text-xs text-primary-foreground/70">
                  Resposta em até 1 dia útil.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
