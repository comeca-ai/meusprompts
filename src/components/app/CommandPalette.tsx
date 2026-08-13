import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { BookOpen, FileText, Plus, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import { splitHighlight, type VaultPrompt } from '@/lib/vault'

interface PaletteItem {
  key: string
  group: 'Prompts' | 'Ações'
  label: string
  hint?: string
  icon: 'prompt' | 'new' | 'library'
  run: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Command Palette (⌘K): busca local em prompts + ações rápidas. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const search = trpc.vault.list.useQuery(
    { q: q.trim() || undefined },
    { enabled: open, staleTime: 10_000 },
  )

  const items = useMemo<PaletteItem[]>(() => {
    const prompts = ((search.data ?? []) as VaultPrompt[]).slice(0, 8)
    const promptItems: PaletteItem[] = prompts.map((p) => ({
      key: `p-${p.id}`,
      group: 'Prompts',
      label: p.title,
      hint: `v${p.currentVersion} · ${p.category}`,
      icon: 'prompt',
      run: () => {
        onOpenChange(false)
        navigate(`/app/prompts/${p.id}`)
      },
    }))
    const actions: PaletteItem[] = [
      {
        key: 'a-new',
        group: 'Ações',
        label: 'Novo prompt',
        hint: 'Criar no editor',
        icon: 'new',
        run: () => {
          onOpenChange(false)
          navigate('/app/prompts/novo')
        },
      },
      {
        key: 'a-lib',
        group: 'Ações',
        label: 'Ir para Biblioteca',
        hint: 'Prompts por setor',
        icon: 'library',
        run: () => {
          onOpenChange(false)
          navigate('/app/biblioteca')
        },
      },
    ]
    return [...promptItems, ...actions]
  }, [search.data, navigate, onOpenChange])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [q])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[active]?.run()
    }
  }

  let lastGroup = ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Busca rápida</DialogTitle>
        <div className="flex items-center gap-3 border-b border-[#e3e9f6] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#8b97b8]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar prompts ou ações…"
            className="h-12 w-full bg-transparent text-[15px] text-[#0b1020] outline-none placeholder:text-[#8b97b8]"
          />
          <kbd className="rounded border border-[#e3e9f6] bg-[#f5f7fc] px-1.5 py-0.5 text-[10px] font-medium text-[#8b97b8]">
            Esc
          </kbd>
        </div>
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[#8b97b8]">
              Nada encontrado.
            </p>
          ) : (
            items.map((item, idx) => {
              const header =
                item.group !== lastGroup ? (
                  <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                    {item.group}
                  </p>
                ) : null
              lastGroup = item.group
              return (
                <div key={item.key}>
                  {header}
                  <motion.button
                    type="button"
                    data-idx={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.18 }}
                    onMouseEnter={() => setActive(idx)}
                    onClick={item.run}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                      active === idx ? 'bg-[#eaf0ff]' : 'bg-transparent',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f5f7fc] text-[#3e7aef]">
                      {item.icon === 'prompt' ? (
                        <FileText className="h-3.5 w-3.5" />
                      ) : item.icon === 'new' ? (
                        <Plus className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#0b1020]">
                        {splitHighlight(item.label, q).map((p, i) =>
                          p.hit ? (
                            <mark key={i} className="bg-transparent font-semibold text-[#3e7aef]">
                              {p.text}
                            </mark>
                          ) : (
                            <span key={i}>{p.text}</span>
                          ),
                        )}
                      </span>
                      {item.hint ? (
                        <span className="block truncate text-[11px] text-[#8b97b8]">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                  </motion.button>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
