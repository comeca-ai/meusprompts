import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Wand2,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayoutSkeleton } from '@/components/AuthLayoutSkeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { CommandPalette } from './CommandPalette'
import { ImproveWithAIModal } from './ImproveWithAIModal'

const NAV_ITEMS = [
  { label: 'Minha Biblioteca', path: '/app', icon: LayoutGrid, end: true, adminOnly: false },
  { label: 'Artefatos', path: '/app/artefatos', icon: Code2, end: false, adminOnly: false },
  { label: 'Biblioteca Setorial', path: '/app/biblioteca', icon: BookOpen, end: false, adminOnly: false },
  { label: 'Dados', path: '/dados', icon: LayoutDashboard, end: false, adminOnly: true },
]

interface ImproveRequest {
  prompt: string
  sector?: string | null
  onApply?: (improved: string, sectorId: string, sectorLabel: string) => void
}

interface AppShellContextValue {
  openImprove: (req: ImproveRequest) => void
  openPalette: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

/** Acesso às ações globais da shell (modal Melhorar com IA, palette ⌘K). */
export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error('useAppShell deve ser usado dentro de <AppShell>')
  return ctx
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="font-display text-lg font-bold tracking-tight text-[#e7edff]">
        c<span className="text-[#8fb2ff]">∞</span>meca.ai
      </span>
      <span className="rounded-full bg-[#131a30] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b97b8]">
        meusprompts
      </span>
    </Link>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={onNavigate}
          className="group relative"
        >
          {({ isActive }) => (
            <span
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#3e7aef]/[0.16] text-white'
                  : 'text-[#8b97b8] hover:bg-[#8fb2ff]/[0.08] hover:text-[#e7edff]',
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="app-nav-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#8fb2ff]"
                />
              ) : null}
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive ? 'text-[#8fb2ff]' : 'text-[#8b97b8] group-hover:text-[#8fb2ff]',
                )}
              />
              <span className="truncate">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  // Sair → volta para a página inicial do site
  const { user, logout } = useAuth({ redirectPath: '/' })

  const initials = (user?.name ?? user?.email ?? '?')
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5">
        <Wordmark />
      </div>

      <div className="px-3">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="px-3 pt-4">
        <Button
          onClick={() => {
            onNavigate?.()
            navigate('/app/prompts/novo')
          }}
          className="w-full bg-[#3e7aef] font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#2f5fd0]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo prompt
        </Button>
      </div>

      <div className="mx-4 my-5 border-t border-[#232c47]" />

      <div className="flex flex-col gap-1 px-3 text-[13px]">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#8b97b8] transition-colors hover:bg-[#8fb2ff]/[0.08] hover:text-[#e7edff]"
        >
          <ArrowUpRight className="h-4 w-4" />
          Voltar ao site
        </Link>
        <Link
          to="/#ferramenta"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#8b97b8] transition-colors hover:bg-[#8fb2ff]/[0.08] hover:text-[#e7edff]"
        >
          <Wand2 className="h-4 w-4" />
          Melhorar meu prompt (grátis)
        </Link>
      </div>

      <div className="mt-auto p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#232c47] bg-[#131a30] p-3 text-left transition-colors hover:border-[#8fb2ff]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb2ff]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3e7aef]/25 text-[13px] font-semibold text-[#8fb2ff]">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-white">
                  {user?.name ?? 'Conta'}
                </span>
                <span className="block truncate text-[11px] text-[#8b97b8]">
                  {user?.email ?? ''}
                </span>
              </span>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-[#8b97b8]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-[#d64545] focus:text-[#d64545]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export interface AppShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Shell compartilhado das páginas /app/* — sidebar escura ink + topbar com busca ⌘K,
 * sobre canvas claro #f5f7fc (app-design.md §3). Exige login (useAuth).
 */
export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [improve, setImprove] = useState<(ImproveRequest & { open: boolean }) | null>(
    null,
  )

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const openImprove = useCallback(
    (req: ImproveRequest) => setImprove({ ...req, open: true }),
    [],
  )

  // ⌘K / Ctrl+K global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Não autenticado → useAuth redireciona para /login; mostra skeleton no interim
  if (isLoading || !user) {
    return <AuthLayoutSkeleton />
  }

  return (
    <AppShellContext.Provider value={{ openImprove, openPalette }}>
      <div className="min-h-[100dvh] bg-[#f5f7fc]">
        {/* Sidebar desktop */}
        <motion.aside
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#232c47] bg-[#0b1020] lg:block"
        >
          <SidebarContent />
        </motion.aside>

        {/* Drawer mobile */}
        <AnimatePresence>
          {drawerOpen ? (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-40 bg-[#0b1020]/60 backdrop-blur-[2px] lg:hidden"
              />
              <motion.aside
                key="drawer"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[#232c47] bg-[#0b1020] lg:hidden"
              >
                <button
                  type="button"
                  aria-label="Fechar menu"
                  onClick={() => setDrawerOpen(false)}
                  className="absolute right-3 top-4 rounded-md p-1.5 text-[#8b97b8] hover:bg-[#8fb2ff]/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <SidebarContent onNavigate={() => setDrawerOpen(false)} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        {/* Coluna principal */}
        <div className="lg:pl-[264px]">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-[#e3e9f6] bg-[#f5f7fc]/85 px-4 backdrop-blur-[8px] md:px-6">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-[#55617c] hover:bg-[#eaf0ff] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold leading-tight text-[#0b1020]">
                {title}
              </h1>
              {subtitle ? (
                <p className="hidden truncate text-[13px] leading-tight text-[#55617c] sm:block">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-9 w-[280px] items-center gap-2 rounded-full border border-[#e3e9f6] bg-white px-3.5 text-sm text-[#8b97b8] transition-colors hover:border-[#3e7aef]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3e7aef] md:flex"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Buscar…</span>
                <kbd className="rounded border border-[#e3e9f6] bg-[#f5f7fc] px-1.5 py-0.5 text-[10px] font-medium text-[#8b97b8]">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                aria-label="Buscar"
                onClick={() => setPaletteOpen(true)}
                className="rounded-lg p-2 text-[#55617c] hover:bg-[#eaf0ff] md:hidden"
              >
                <Search className="h-5 w-5" />
              </button>
              <Button
                variant="ghost"
                onClick={() => openImprove({ prompt: '' })}
                className="hidden bg-[#eaf0ff] text-[#3e7aef] hover:bg-[#dbe7ff] sm:inline-flex"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Melhorar com IA
              </Button>
              <Button
                asChild
                className="hidden bg-[#3e7aef] text-white hover:bg-[#2f5fd0] md:inline-flex"
              >
                <Link to="/app/prompts/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo prompt
                </Link>
              </Button>
            </div>
          </header>

          <main>{children}</main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <ImproveWithAIModal
          open={improve?.open ?? false}
          onOpenChange={(open) =>
            setImprove((cur) => (cur ? { ...cur, open } : null))
          }
          prompt={improve?.prompt ?? ''}
          initialSector={improve?.sector ?? null}
          onApply={
            improve?.onApply
              ? (improved, sectorId, sectorLabel) => {
                  improve.onApply?.(improved, sectorId, sectorLabel)
                  setImprove((cur) => (cur ? { ...cur, open: false } : null))
                }
              : undefined
          }
        />
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </AppShellContext.Provider>
  )
}
