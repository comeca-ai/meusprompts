import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Search,
  Wand2,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app'
import Reveal from '@/components/Reveal'
import { Button } from '@/components/ui/button'
import { trpc } from '@/providers/trpc'
import { SECTOR_META } from '@/lib/vault'
import {
  SECTOR_LIBRARY_CONTENT,
  type LibraryItemData,
} from '@/lib/library'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** /app/biblioteca — visão geral da Biblioteca pública por setor (app-biblioteca.md §1). */
export default function Library() {
  return (
    <AppShell
      title="Biblioteca"
      subtitle="Playbooks e prompts-semente curados por setor"
    >
      <LibraryContent />
    </AppShell>
  )
}

function LibraryContent() {
  const { openImprove } = useAppShell()
  const libraryQuery = trpc.library.list.useQuery({})
  const items = useMemo(
    () => (libraryQuery.data ?? []) as LibraryItemData[],
    [libraryQuery.data],
  )

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of items) map.set(it.sector, (map.get(it.sector) ?? 0) + 1)
    return map
  }, [items])

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <LibraryHero items={items} />

      {/* Grid de SectorCards — Reveal on scroll, stagger 80ms */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTOR_META.map((sector, i) => (
          <Reveal key={sector.id} delay={i * 80}>
            <SectorCard sector={sector} count={counts.get(sector.id) ?? 0} />
          </Reveal>
        ))}
      </div>

      {/* Faixa "Melhore os seus" */}
      <Reveal delay={80} className="mt-6">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#eaf0ff] p-6 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
            <Wand2 className="h-5 w-5 text-[#3e7aef]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-[#0b1020]">
              Já tem seus próprios prompts?
            </h3>
            <p className="mt-0.5 text-[13.5px] text-[#55617c]">
              Use o Melhorar com IA com o playbook de qualquer setor — direto no
              sua biblioteca.
            </p>
          </div>
          <Button
            onClick={() => openImprove({ prompt: '' })}
            className="bg-[#3e7aef] font-semibold text-white hover:bg-[#2f5fd0]"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Abrir Melhorar com IA
          </Button>
        </div>
      </Reveal>
    </div>
  )
}

/** Hero interno escuro com glow radial + busca global da biblioteca. */
function LibraryHero({ items }: { items: LibraryItemData[] }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [focused, setFocused] = useState(false)

  // Parallax sutil (6px) do padrão de pontos conforme o scroll
  const { scrollY } = useScroll()
  const dotsY = useTransform(scrollY, [0, 600], [0, 6])

  const needle = term.trim().toLowerCase()
  const grouped = useMemo(() => {
    if (needle.length < 2) return []
    return SECTOR_META.map((sector) => {
      const matches = items
        .filter(
          (it) =>
            it.sector === sector.id &&
            (it.title.toLowerCase().includes(needle) ||
              it.content.toLowerCase().includes(needle)),
        )
        .slice(0, 3)
      return { sector, matches }
    }).filter((g) => g.matches.length > 0)
  }, [items, needle])

  const showDropdown = focused && needle.length >= 2

  const goTo = (sectorId: string) => {
    navigate(`/app/biblioteca/${sectorId}?q=${encodeURIComponent(term.trim())}`)
    setFocused(false)
  }

  const textStagger = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.1 + i * 0.08, ease: EASE },
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="relative overflow-hidden rounded-2xl bg-[#0b1020] p-6 md:p-10"
    >
      {/* Glow radial accent/14 no canto superior direito (único gradiente do app) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8fb2ff]/[0.14] blur-3xl"
      />
      {/* Padrão de pontos #8fb2ff/8 no canto inferior esquerdo */}
      <motion.div
        aria-hidden
        style={{
          y: dotsY,
          backgroundImage:
            'radial-gradient(rgba(143, 178, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
        className="pointer-events-none absolute bottom-0 left-0 h-40 w-64"
      />

      <div className="relative">
        <motion.p
          {...textStagger(0)}
          className="text-[11px] font-semibold uppercase tracking-wide text-[#8fb2ff]"
        >
          Biblioteca comeca.ai
        </motion.p>
        <motion.h2
          {...textStagger(1)}
          className="mt-2 max-w-2xl font-display text-[28px] font-bold leading-tight tracking-tight text-white"
        >
          Prompts profissionais do seu setor, prontos para usar.
        </motion.h2>
        <motion.p
          {...textStagger(2)}
          className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-[#8b97b8]"
        >
          Curadoria para pequenas empresas brasileiras: cada prompt segue o
          playbook do setor — papel, contexto, formato e restrições. Copie,
          salve na sua biblioteca ou melhore os seus com IA.
        </motion.p>

        {/* Busca global da biblioteca */}
        <motion.div {...textStagger(3)} className="relative mt-5 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b97b8]" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFocused(false)
            }}
            placeholder="Buscar na biblioteca… (ex.: responder review, proposta, WhatsApp)"
            className="h-12 w-full rounded-xl border border-[#232c47] bg-[#131a30] pl-11 pr-4 text-sm text-[#e7edff] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#8fb2ff]/60 focus:ring-2 focus:ring-[#8fb2ff]/30"
          />

          {showDropdown ? (
            <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 max-h-[320px] overflow-y-auto rounded-xl border border-[#232c47] bg-[#131a30] p-2 shadow-[0_8px_32px_rgb(3_6_18/0.5)]">
              {grouped.length === 0 ? (
                <p className="px-3 py-2.5 text-[13px] text-[#8b97b8]">
                  Nenhum prompt encontrado para “{term.trim()}”.
                </p>
              ) : (
                grouped.map(({ sector, matches }) => (
                  <div key={sector.id}>
                    <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      {sector.label}
                    </p>
                    {matches.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          goTo(sector.id)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#e7edff] transition-colors hover:bg-[#8fb2ff]/[0.08]"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {it.title}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8b97b8]" />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </motion.div>

        {/* Micro-prova */}
        <motion.div
          {...textStagger(4)}
          className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5"
        >
          {['6 setores', 'Playbooks inclusos', 'Grátis para sempre'].map(
            (label) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[13px] text-[#8b97b8]"
              >
                <Check className="h-3.5 w-3.5 text-[#8fb2ff]" />
                {label}
              </span>
            ),
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}

function SectorCard({
  sector,
  count,
}: {
  sector: (typeof SECTOR_META)[number]
  count: number
}) {
  const content = SECTOR_LIBRARY_CONTENT[sector.id]
  const Icon = sector.icon
  return (
    <Link
      to={`/app/biblioteca/${sector.id}`}
      className="shadow-warm hover:shadow-warm-lg group relative block h-full overflow-hidden rounded-xl border border-[#e3e9f6] bg-white p-5 transition-all duration-200 hover:-translate-y-[3px]"
    >
      {/* Barra superior 3px na cor do setor (hover, origin-left) */}
      <span
        aria-hidden
        style={{ backgroundColor: sector.color }}
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-[250ms] group-hover:scale-x-100"
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${sector.color}1f` }}
        >
          <Icon className="h-5 w-5" style={{ color: sector.color }} />
        </span>
        <span className="rounded-full border border-[#e3e9f6] px-2.5 py-1 text-[11px] font-medium text-[#55617c]">
          {count} prompt{count === 1 ? '' : 's'}
        </span>
      </div>

      <h3 className="mt-3 font-display text-[17px] font-semibold text-[#0b1020]">
        {sector.label}
      </h3>
      <p className="mt-0.5 text-[13px] text-[#55617c]">{content?.tagline}</p>

      {content ? (
        <ul className="mt-3 space-y-1.5">
          {content.bullets.slice(0, 3).map((b) => (
            <li
              key={b}
              className="flex items-start gap-1.5 text-[12px] leading-snug text-[#55617c]"
            >
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: sector.color }}
              />
              {b}
            </li>
          ))}
        </ul>
      ) : null}

      <span className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-[#3e7aef]">
        Ver prompts
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  )
}
