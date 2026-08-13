import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  /** Chip de contexto à direita (ex.: "+3 essa semana") */
  chip?: string
  /** Cor do ícone (default: primary) */
  iconColor?: string
  active?: boolean
  onClick?: () => void
}

/** StatCard do vault com count-up (app-design.md §4.1). */
export function StatCard({
  icon: Icon,
  label,
  value,
  chip,
  iconColor = '#3e7aef',
  active,
  onClick,
}: StatCardProps) {
  const display = useCountUp(value, 700, 150)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'shadow-warm hover:shadow-warm-lg group flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition-shadow',
        active ? 'border-[#3e7aef]/60 ring-2 ring-[#3e7aef]/20' : 'border-[#e3e9f6]',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf0ff]"
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-[#55617c]">
          {label}
        </span>
        <span className="mt-0.5 block font-display text-3xl font-bold tabular-nums tracking-tight text-[#0b1020]">
          {display}
        </span>
      </span>
      {chip ? (
        <span className="hidden shrink-0 self-start rounded-full bg-[#eaf0ff] px-2 py-0.5 text-[11px] font-medium text-[#3e7aef] sm:block">
          {chip}
        </span>
      ) : null}
    </motion.button>
  )
}
