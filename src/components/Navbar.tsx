import { useState } from 'react'
import { Link } from 'react-router'
import { Loader2, Menu, MessageCircle, X } from 'lucide-react'
import { whatsappLink, trackWhatsappClick } from '@/lib/whatsapp'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#ferramenta', label: 'Ferramenta' },
  { href: '#oferta', label: 'Oferta' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const authArea = isLoading ? (
    <span
      aria-hidden
      className="inline-flex h-9 w-20 items-center justify-center rounded-full border border-border bg-secondary/50"
    >
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </span>
  ) : isAuthenticated && user ? (
    <span className="flex items-center gap-3">
      <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">
        {user.name ?? user.email ?? 'Conta'}
      </span>
      <button
        type="button"
        onClick={() => logout()}
        className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-secondary"
      >
        Sair
      </button>
    </span>
  ) : (
    <Link
      to={LOGIN_PATH}
      className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-secondary"
    >
      Entrar
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 animate-fade-down border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            c∞meca.ai
          </span>
          <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold leading-tight text-secondary-foreground sm:block">
            Melhore Meu Prompt · por Setor
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick()}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-secondary"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-[#2f5fd0]"
          >
            Abrir o app
          </Link>
          {authArea}
        </nav>

        <button
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-primary md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {link.label}
            </a>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick()}
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </a>
          <Link
            to="/app"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary"
          >
            Abrir o app
          </Link>
          <div className="mt-2 px-3 py-2.5">{authArea}</div>
        </nav>
      )}
    </header>
  )
}
