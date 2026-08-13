/**
 * Componentes compartilhados da área logada (app "meusprompts").
 * Outros agentes: importem daqui — `import { AppShell, StatCard, ... } from '@/components/app'`.
 */
export { AppShell, useAppShell } from './AppShell'
export type { AppShellProps } from './AppShell'
export { StatCard } from './StatCard'
export { PromptCard } from './PromptCard'
export type { PromptCardProps } from './PromptCard'
export { EmptyState } from './EmptyState'
export type { EmptyStateAction } from './EmptyState'
export { ImproveWithAIModal } from './ImproveWithAIModal'
export type { ImproveWithAIModalProps } from './ImproveWithAIModal'
export { CommandPalette } from './CommandPalette'
export { VersionTimeline } from './VersionTimeline'
export { DiffModal } from './DiffModal'
export { toastSuccess, toastInfo, toastError, toastUndo } from './toasts'
