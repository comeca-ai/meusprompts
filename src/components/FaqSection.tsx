import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Reveal from '@/components/Reveal'

const FAQ_ITEMS = [
  {
    q: 'É grátis mesmo?',
    a: 'Sim. O 1º uso é livre, sem cadastro. Para continuar usando sem limite, pedimos só seu nome e email — em troca, você recebe o guia de prompts do seu setor. Não vendemos nem compartilhamos seus dados.',
  },
  {
    q: 'Meus prompts ficam privados?',
    a: 'Seus prompts não ficam salvos no nosso site. Quando a melhoria por IA está ativa, o texto é enviado apenas para processar a resposta (via OpenRouter), sem treinar modelos com seus dados. Recomendamos não colar informações confidenciais de clientes.',
  },
  {
    q: 'Funciona com ChatGPT, Claude e Gemini?',
    a: 'Sim. O prompt melhorado é entregue em texto puro, pronto para colar em qualquer IA: ChatGPT, Claude, Gemini, Copilot ou outra que você prefira.',
  },
  {
    q: 'O que é a biblioteca completa?',
    a: 'É a nossa oferta paga: mais de 50 prompts profissionais do seu setor, implantados com a sua equipe, com treinamento de 1 hora e atualizações mensais — por um investimento único de R$497. É o caminho mais rápido para sua empresa usar IA de verdade, todos os dias.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold text-primary md:text-4xl">
            Perguntas frequentes
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-border bg-card px-5 shadow-warm"
              >
                <AccordionTrigger className="py-5 text-left font-semibold text-foreground hover:text-primary hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
