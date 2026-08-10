import { Link } from 'react-router'
import { Wand2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0A3945] text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Wand2 className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold">
                Melhore Meu Prompt
                <span className="text-[hsl(var(--coral))]"> · por Setor</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-primary-foreground/70">
              Feito para pequenos empresários brasileiros usarem IA de verdade.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
            <a href="#ferramenta" className="hover:text-white">
              Ferramenta
            </a>
            <a href="#oferta" className="hover:text-white">
              Oferta
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <Link to="/dados" className="hover:text-white">
              Dados
            </Link>
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-primary-foreground/50 md:flex-row md:items-center">
          <span>
            © {new Date().getFullYear()} Melhore Meu Prompt — por Setor
          </span>
          <span>
            um projeto <span className="font-semibold">comeca.ai</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
