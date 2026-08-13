import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Copy,
  GitCompare,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  CopyPlus,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  getCategory,
  getSectorMeta,
  relTime,
  splitHighlight,
  type VaultPrompt,
} from '@/lib/vault'

function Highlighted({ text, term }: { text: string; term?: string }) {
  if (!term?.trim()) return <>{text}</>
  return (
    <>
      {splitHighlight(text, term).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-sm bg-[#eaf0ff] px-0.5 text-[#3e7aef]">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

export interface PromptCardProps {
  prompt: VaultPrompt
  /** Termo de busca para highlight */
  term?: string
  onOpen: (prompt: VaultPrompt) => void
  onCopy: (prompt: VaultPrompt) => void
  onToggleFavorite: (prompt: VaultPrompt) => void
  onImprove: (prompt: VaultPrompt) => void
  onDuplicate: (prompt: VaultPrompt) => void
  onToggleVisibility: (prompt: VaultPrompt) => void
  onShowVersions: (prompt: VaultPrompt) => void
  onDelete: (prompt: VaultPrompt) => void
}

/** Card de prompt do vault (app-design.md §4.2). */
export function PromptCard({
  prompt,
  term,
  onOpen,
  onCopy,
  onToggleFavorite,
  onImprove,
  onDuplicate,
  onToggleVisibility,
  onShowVersions,
  onDelete,
}: PromptCardProps) {
  const category = getCategory(prompt.category)
  const sector = getSectorMeta(prompt.sector)
  const [copied, setCopied] = useState(false)

  // Pop da estrela só ao alternar (não no primeiro render)
  const prevFav = useRef(prompt.isFavorite)
  const [favPop, setFavPop] = useState(0)
  useEffect(() => {
    if (prevFav.current !== prompt.isFavorite) {
      prevFav.current = prompt.isFavorite
      setFavPop((n) => n + 1)
    }
  }, [prompt.isFavorite])

  const handleCopy = () => {
    onCopy(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const excerpt =
    prompt.content.length > 140 ? `${prompt.content.slice(0, 140)}…` : prompt.content

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(prompt)}
      className="group flex h-[188px] cursor-pointer flex-col rounded-xl border border-[#e3e9f6] bg-white p-4 shadow-warm transition-colors hover:border-[#3e7aef]/40 hover:shadow-warm-lg"
    >
      {/* Topo: categoria + visibilidade + favorito */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: `${category.color}1f`, color: category.color }}
        >
          {category.label}
        </span>
        {sector ? (
          <span className="hidden items-center gap-1 text-[11px] font-medium text-[#55617c] sm:inline-flex">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: sector.color }}
            />
            {sector.label}
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {prompt.visibility === 'public' ? (
            <Globe className="h-4 w-4 text-[#3e7aef]" aria-label="Público" />
          ) : (
            <Lock className="h-4 w-4 text-[#55617c]" aria-label="Privado" />
          )}
          <motion.span
            key={favPop}
            animate={favPop > 0 ? { scale: [1, 1.35, 1] } : undefined}
            transition={{ duration: 0.25 }}
            className="inline-flex"
          >
            <button
              type="button"
              aria-label={prompt.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(prompt)
              }}
              className="rounded-md p-1 transition-colors hover:bg-[#f5f7fc]"
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-colors',
                  prompt.isFavorite
                    ? 'fill-[#f2a63b] text-[#f2a63b]'
                    : 'text-[#8b97b8]',
                )}
              />
            </button>
          </motion.span>
        </span>
      </div>

      {/* Título */}
      <h3 className="mt-2.5 truncate font-display text-[15.5px] font-semibold text-[#0b1020]">
        <Highlighted text={prompt.title} term={term} />
      </h3>

      {/* Trecho mono */}
      <p className="mt-2 line-clamp-2 rounded-md bg-[#f5f7fc] p-2 font-mono text-[12.5px] leading-relaxed text-[#55617c]">
        <Highlighted text={excerpt} term={term} />
      </p>

      {/* Rodapé */}
      <div className="mt-auto flex items-center gap-2 pt-3">
        <span className="rounded-full bg-[#eaf0ff] px-2 py-0.5 font-display text-[11px] font-semibold text-[#3e7aef]">
          v{prompt.currentVersion}
        </span>
        <span className="text-[11px] text-[#8b97b8]">
          atualizado {relTime(prompt.updatedAt)}
        </span>
        <span
          className="ml-auto flex items-center gap-0.5 opacity-0 transition-all duration-150 [transform:translateY(8px)] group-hover:opacity-100 group-hover:[transform:translateY(0)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Copiar prompt"
            onClick={handleCopy}
            className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#22a58a]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label="Melhorar com IA"
            onClick={() => onImprove(prompt)}
            className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
          >
            <Wand2 className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Mais ações"
                className="rounded-md p-1.5 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onOpen(prompt)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(prompt)}>
                <CopyPlus className="mr-2 h-4 w-4" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowVersions(prompt)}>
                <GitCompare className="mr-2 h-4 w-4" /> Ver versões
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleVisibility(prompt)}>
                {prompt.visibility === 'public' ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Tornar privado
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" /> Tornar público
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(prompt)}
                className="text-[#d64545] focus:text-[#d64545]"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>
    </motion.div>
  )
}
