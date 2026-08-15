import { Link } from 'react-router'

export default function Footer() {
  return (
    <footer className="bg-[#0b1020] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-xl font-bold tracking-tight text-[#8fb2ff]">
                c∞meca.ai
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                Melhore Meu Prompt · por Setor
              </span>
            </div>
            <img
              src="/assinatura-grupo-comeca.png"
              alt="Uma empresa do grupo comeca.ai"
              className="mt-3 h-14 w-auto rounded-xl"
            />
            <p className="mt-3 max-w-sm text-sm text-white/70">
              Uma ferramenta gratuita do ecossistema comeca.ai — IA de verdade
              para o empresário paraibano.
            </p>
            <a
              href="https://comeca.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8fb2ff] underline-offset-4 hover:underline"
            >
              Conhecer a imersão Começa Ai para Donos →
            </a>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
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
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
          <span>
            © {new Date().getFullYear()} Melhore Meu Prompt — por Setor
          </span>
          <span>
            um projeto{' '}
            <a
              href="https://comeca.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/70 hover:text-white"
            >
              comeca.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
