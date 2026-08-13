import { motion } from 'framer-motion'
import { GitCompare, RotateCcw, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relTime, type VaultVersion } from '@/lib/vault'

export interface VersionTimelineProps {
  /** Versões em ordem decrescente (mais recente primeiro) */
  versions: VaultVersion[]
  currentVersion: number
  onDiff: (version: VaultVersion) => void
  onRestore: (version: VaultVersion) => void
}

/** Timeline vertical de versões (app-design.md §4.6). */
export function VersionTimeline({
  versions,
  currentVersion,
  onDiff,
  onRestore,
}: VersionTimelineProps) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-[#e3e9f6] pl-5">
      {versions.map((v, idx) => {
        const isCurrent = v.version === currentVersion
        const isAi = v.source === 'ai'
        return (
          <motion.li
            key={v.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 32,
              delay: Math.min(idx * 0.04, 0.3),
            }}
            className="relative"
          >
            {/* Nó da timeline */}
            <span
              className={cn(
                'absolute -left-[27px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white',
                isCurrent ? 'border-[#3e7aef]' : 'border-[#e3e9f6]',
              )}
            >
              {isAi ? (
                <Wand2 className="h-2 w-2 text-[#3e7aef]" />
              ) : (
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isCurrent ? 'bg-[#3e7aef]' : 'bg-[#c6d2ec]',
                  )}
                />
              )}
            </span>

            <div className="group rounded-lg border border-transparent p-2 transition-colors hover:border-[#e3e9f6] hover:bg-[#f5f7fc]">
              <div className="flex items-center gap-2">
                <span className="font-display text-[13px] font-semibold text-[#0b1020]">
                  v{v.version}
                </span>
                {isAi ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-[#eaf0ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#3e7aef]">
                    <Wand2 className="h-2.5 w-2.5" /> IA
                  </span>
                ) : null}
                {isCurrent ? (
                  <span className="rounded-full bg-[#eaf0ff] px-2 py-0.5 text-[10px] font-semibold text-[#3e7aef]">
                    atual
                  </span>
                ) : null}
                <span className="ml-auto text-[11px] text-[#8b97b8]">
                  {relTime(v.createdAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[#55617c]">
                {v.changeNote?.trim() ? v.changeNote : 'Edição manual'}
              </p>
              <div className="mt-1.5 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                {idx < versions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onDiff(v)}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-[#3e7aef] hover:underline"
                  >
                    <GitCompare className="h-3 w-3" /> Ver diff
                  </button>
                ) : null}
                {!isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onRestore(v)}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-[#55617c] hover:text-[#3e7aef] hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" /> Restaurar
                  </button>
                ) : null}
              </div>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
