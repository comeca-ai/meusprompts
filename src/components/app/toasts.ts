import { toast } from 'sonner'

/** Toasts do app (sonner) — canto inferior direito, configurados no AppShell. */

export function toastSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined)
}

export function toastInfo(message: string, description?: string) {
  toast(message, description ? { description } : undefined)
}

export function toastError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined)
}

/** Toast de exclusão com ação "Desfazer" (6s). */
export function toastUndo(message: string, onUndo: () => void) {
  toast(message, {
    duration: 6000,
    action: {
      label: 'Desfazer',
      onClick: onUndo,
    },
  })
}
