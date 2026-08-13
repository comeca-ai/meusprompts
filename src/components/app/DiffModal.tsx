import { useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { diffLines, type VaultVersion } from '@/lib/vault'

export interface DiffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Versão mais antiga */
  from: VaultVersion | null
  /** Versão mais nova */
  to: VaultVersion | null
}

/** Diff lado a lado entre duas versões (app-design.md §4.7). */
export function DiffModal({ open, onOpenChange, from, to }: DiffModalProps) {
  const diff = useMemo(
    () => (from && to ? diffLines(from.content, to.content) : null),
    [from, to],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <div className="border-b border-[#e3e9f6] px-6 py-4">
          <DialogTitle className="font-display text-base font-semibold text-[#0b1020]">
            {from && to ? `v${from.version} → v${to.version}` : 'Comparar versões'}
          </DialogTitle>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[#55617c]">
            {from ? (
              <span>
                <span className="font-semibold text-[#d64545]">v{from.version}:</span>{' '}
                {from.changeNote?.trim() || 'Edição manual'}
              </span>
            ) : null}
            {to ? (
              <span>
                <span className="font-semibold text-[#3e7aef]">v{to.version}:</span>{' '}
                {to.changeNote?.trim() || 'Edição manual'}
              </span>
            ) : null}
          </div>
        </div>

        {diff ? (
          <div className="grid max-h-[70vh] grid-cols-1 overflow-y-auto md:grid-cols-2">
            <DiffColumn
              title={from ? `Antes · v${from.version}` : 'Antes'}
              lines={diff.left}
              changedClass="bg-[#fdecec] border-l-[3px] border-l-[#d64545]"
              filter="removed"
            />
            <DiffColumn
              title={to ? `Depois · v${to.version}` : 'Depois'}
              lines={diff.right}
              changedClass="bg-[#eaf0ff] border-l-[3px] border-l-[#3e7aef]"
              filter="added"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DiffColumn({
  title,
  lines,
  changedClass,
  filter,
}: {
  title: string
  lines: { text: string; type: 'same' | 'added' | 'removed' }[]
  changedClass: string
  filter: 'added' | 'removed'
}) {
  return (
    <div className="min-w-0">
      <p className="sticky top-0 border-b border-[#e3e9f6] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#55617c]">
        {title}
      </p>
      <div className="px-2 py-2 font-mono text-[12.5px] leading-relaxed">
        {lines.map((l, i) => {
          const changed = l.type === filter
          return (
            <div
              key={i}
              className={cn(
                'whitespace-pre-wrap break-words rounded-sm px-2 py-0.5',
                changed
                  ? changedClass
                  : 'border-l-[3px] border-l-transparent text-[#55617c]',
              )}
            >
              {l.text || ' '}
            </div>
          )
        })}
      </div>
    </div>
  )
}
