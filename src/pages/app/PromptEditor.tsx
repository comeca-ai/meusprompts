import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Braces,
  Check,
  ChevronDown,
  Copy,
  CopyPlus,
  Download,
  Globe,
  History,
  Lightbulb,
  Loader2,
  Lock,
  MoreHorizontal,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import {
  AppShell,
  DiffModal,
  VersionTimeline,
  toastSuccess,
  toastUndo,
  useAppShell,
} from '@/components/app'
import { cn } from '@/lib/utils'
import {
  SECTOR_META,
  VAULT_CATEGORIES,
  extractVariables,
  getCategory,
  getSectorMeta,
  type VaultPrompt,
  type VaultVersion,
} from '@/lib/vault'

const PLACEHOLDER =
  'Ex.: Aja como um atendente sênior da minha clínica de estética. Responda à mensagem abaixo no WhatsApp, com tom acolhedor, no máximo 3 parágrafos, terminando com uma pergunta para marcar horário. Mensagem: {{mensagem_do_cliente}}'

const NEW_TIPS = [
  'Diga quem a IA deve ser (papel)',
  'Dê contexto do seu negócio',
  'Defina o formato da resposta e restrições',
]

export default function PromptEditor() {
  return (
    <AppShell title="Editor de prompt" subtitle="Cada salvamento cria uma versão — nada se perde">
      <EditorContent />
    </AppShell>
  )
}

interface FormState {
  title: string
  content: string
  category: string
  sector: string | null
  visibility: 'public' | 'private'
  isFavorite: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  category: 'Outros',
  sector: null,
  visibility: 'private',
  isFavorite: false,
}

function EditorContent() {
  const { id: idParam } = useParams()
  const promptId = idParam ? Number(idParam) : null
  const isNew = promptId === null
  const navigate = useNavigate()
  const { openImprove } = useAppShell()
  const utils = trpc.useUtils()

  const promptQuery = trpc.vault.get.useQuery(
    { id: promptId ?? 0 },
    { enabled: !isNew, retry: false },
  )
  const versionsQuery = trpc.vault.versions.useQuery(
    { promptId: promptId ?? 0 },
    { enabled: !isNew },
  )

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM)
  const [changeNote, setChangeNote] = useState('')
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})
  const [shake, setShake] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [diffPair, setDiffPair] = useState<{
    from: VaultVersion
    to: VaultVersion
  } | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<VaultVersion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState<(() => void) | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Carrega prompt existente no form
  useEffect(() => {
    const p = promptQuery.data as VaultPrompt | undefined
    if (p) {
      const loaded: FormState = {
        title: p.title,
        content: p.content,
        category: p.category,
        sector: p.sector,
        visibility: p.visibility === 'public' ? 'public' : 'private',
        isFavorite: p.isFavorite,
      }
      setForm(loaded)
      setBaseline(loaded)
    }
  }, [promptQuery.data])

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  )

  const variables = useMemo(() => extractVariables(form.content), [form.content])
  const versions = useMemo(
    () => (versionsQuery.data ?? []) as VaultVersion[],
    [versionsQuery.data],
  )
  const currentVersion =
    (promptQuery.data as VaultPrompt | undefined)?.currentVersion ??
    versions[0]?.version ??
    0

  // Auto-grow do textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.max(el.scrollHeight, 320)}px`
    }
  }, [form.content])

  // Aviso ao fechar a aba com mudanças não salvas
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const invalidate = useCallback(() => {
    void utils.vault.list.invalidate()
    void utils.vault.stats.invalidate()
    if (!isNew) {
      void utils.vault.get.invalidate({ id: promptId })
      void utils.vault.versions.invalidate({ promptId })
    }
  }, [utils, isNew, promptId])

  const createMut = trpc.vault.create.useMutation()
  const saveMut = trpc.vault.save.useMutation()
  const removeMut = trpc.vault.remove.useMutation()
  const favMut = trpc.vault.toggleFavorite.useMutation({ onSuccess: invalidate })

  const saving = createMut.isPending || saveMut.isPending

  // ===== Salvar =====
  const save = useCallback(
    (opts?: { source?: 'manual' | 'ai'; note?: string; silent?: boolean }) => {
      const errs: typeof errors = {}
      if (form.title.trim().length < 3)
        errs.title = 'Dê um título com pelo menos 3 caracteres.'
      if (form.content.trim().length < 10)
        errs.content = 'Escreva pelo menos 10 caracteres de prompt.'
      setErrors(errs)
      if (Object.keys(errs).length > 0) {
        setShake((n) => n + 1)
        return false
      }

      if (isNew) {
        createMut.mutate(
          {
            title: form.title.trim(),
            content: form.content,
            category: form.category,
            sector: form.sector ?? undefined,
            visibility: form.visibility,
          },
          {
            onSuccess: (created) => {
              toastSuccess('Prompt criado — versão v1 salva')
              void utils.vault.list.invalidate()
              void utils.vault.stats.invalidate()
              if (created) navigate(`/app/prompts/${created.id}`, { replace: true })
            },
          },
        )
        return true
      }

      saveMut.mutate(
        {
          id: promptId,
          title: form.title.trim(),
          content: form.content,
          category: form.category,
          sector: form.sector,
          visibility: form.visibility,
          changeNote:
            opts?.note ?? (changeNote.trim() ? changeNote.trim() : 'Edição manual'),
          source: opts?.source ?? 'manual',
        },
        {
          onSuccess: (updated) => {
            invalidate()
            setChangeNote('')
            setBaseline(form)
            if (!opts?.silent) {
              setSavedFlash(true)
              window.setTimeout(() => setSavedFlash(false), 1500)
              toastSuccess(`Versão v${updated?.currentVersion ?? ''} salva`.trim())
            }
          },
        },
      )
      return true
    },
    [form, changeNote, isNew, promptId, createMut, saveMut, navigate, utils, invalidate],
  )

  // ⌘S / Ctrl+S e ⌘I
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) save()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        handleImprove()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, save, form, promptId])

  const guardNavigate = (action: () => void) => {
    if (dirty) setConfirmLeave(() => action)
    else action()
  }

  const handleImprove = () => {
    openImprove({
      prompt: form.content,
      sector: form.sector,
      onApply: isNew
        ? undefined
        : (improved, sectorId, sectorLabel) => {
            const next = { ...form, content: improved, sector: sectorId }
            setForm(next)
            saveMut.mutate(
              {
                id: promptId ?? 0,
                title: next.title.trim() || 'Sem título',
                content: improved,
                category: next.category,
                sector: sectorId,
                visibility: next.visibility,
                changeNote: `Melhoria por IA · playbook ${sectorLabel}`,
                source: 'ai',
              },
              {
                onSuccess: (updated) => {
                  invalidate()
                  setBaseline(next)
                  toastSuccess(
                    `Versão v${updated?.currentVersion ?? ''} criada pela IA`.trim(),
                  )
                },
              },
            )
          },
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(form.content)
      toastSuccess('Prompt copiado')
    } catch {
      toastSuccess('Não foi possível copiar automaticamente')
    }
  }

  const handleDuplicate = () => {
    createMut.mutate(
      {
        title: `${form.title || 'Prompt'} (cópia)`,
        content: form.content,
        category: form.category,
        sector: form.sector ?? undefined,
        visibility: 'private',
      },
      {
        onSuccess: () => {
          void utils.vault.list.invalidate()
          void utils.vault.stats.invalidate()
          toastSuccess('Prompt duplicado no vault')
        },
      },
    )
  }

  const handleExport = () => {
    const md = `# ${form.title || 'Prompt'}\n\n- Categoria: ${form.category}\n- Setor: ${getSectorMeta(form.sector)?.label ?? 'Nenhum'}\n- Visibilidade: ${form.visibility === 'public' ? 'Público' : 'Privado'}\n\n\`\`\`\n${form.content}\n\`\`\`\n`
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(form.title || 'prompt').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
    toastSuccess('Arquivo .md exportado')
  }

  const handleToggleVisibility = () => {
    const next = form.visibility === 'public' ? 'private' : 'public'
    setForm((f) => ({ ...f, visibility: next }))
    if (!isNew) {
      saveMut.mutate(
        {
          id: promptId ?? 0,
          title: form.title.trim() || 'Sem título',
          content: form.content,
          category: form.category,
          sector: form.sector,
          visibility: next,
          changeNote:
            next === 'public' ? 'Tornou o prompt público' : 'Tornou o prompt privado',
        },
        {
          onSuccess: () => {
            invalidate()
            setBaseline((b) => ({ ...b, visibility: next }))
            toastSuccess(next === 'public' ? 'Prompt público' : 'Prompt privado')
          },
        },
      )
    }
  }

  const handleDelete = () => {
    setConfirmDelete(false)
    const snapshot = { ...form }
    removeMut.mutate(
      { id: promptId ?? 0 },
      {
        onSuccess: () => {
          void utils.vault.list.invalidate()
          void utils.vault.stats.invalidate()
          navigate('/app')
          toastUndo('Prompt excluído', () => {
            createMut.mutate(
              {
                title: snapshot.title,
                content: snapshot.content,
                category: snapshot.category,
                sector: snapshot.sector ?? undefined,
                visibility: snapshot.visibility,
              },
              {
                onSuccess: () => {
                  void utils.vault.list.invalidate()
                  void utils.vault.stats.invalidate()
                  toastSuccess('Prompt restaurado')
                },
              },
            )
          })
        },
      },
    )
  }

  const handleRestore = () => {
    if (!restoreTarget) return
    const v = restoreTarget
    setRestoreTarget(null)
    const next = { ...form, title: v.title, content: v.content }
    setForm(next)
    saveMut.mutate(
      {
        id: promptId ?? 0,
        title: v.title,
        content: v.content,
        category: form.category,
        sector: form.sector,
        visibility: form.visibility,
        changeNote: `Restaurada da v${v.version}`,
        source: 'manual',
      },
      {
        onSuccess: (updated) => {
          invalidate()
          setBaseline(next)
          toastSuccess(`Versão v${updated?.currentVersion ?? ''} salva`.trim())
        },
      },
    )
  }

  const openDiff = (v: VaultVersion) => {
    const prev = versions.find((x) => x.version === v.version - 1)
    if (prev) setDiffPair({ from: prev, to: v })
  }

  const insertVariable = () => {
    const el = textareaRef.current
    const insertion = '{{variável}}'
    if (!el) {
      setForm((f) => ({ ...f, content: f.content + insertion }))
      return
    }
    const start = el.selectionStart ?? form.content.length
    const end = el.selectionEnd ?? start
    const next =
      form.content.slice(0, start) + insertion + form.content.slice(end)
    setForm((f) => ({ ...f, content: next }))
    requestAnimationFrame(() => {
      el.focus()
      const inner = start + 2
      el.setSelectionRange(inner, inner + 'variável'.length)
    })
  }

  const jumpToVariable = (name: string) => {
    const el = textareaRef.current
    if (!el) return
    const needle = `{{${name}}}`
    const idx = form.content.indexOf(needle)
    if (idx === -1) return
    el.focus()
    el.setSelectionRange(idx, idx + needle.length)
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const loadingExisting = !isNew && promptQuery.isLoading
  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0

  const rail = (
    <div className="rounded-xl border border-[#e3e9f6] bg-white p-4 shadow-warm">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-[#3e7aef]" />
        <h3 className="font-display text-sm font-semibold text-[#0b1020]">Versões</h3>
        <span className="rounded-full bg-[#eaf0ff] px-2 py-0.5 text-[11px] font-semibold text-[#3e7aef]">
          {versions.length}
        </span>
      </div>
      <div className="mt-4">
        {isNew || versions.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf0ff]">
              <History className="h-5 w-5 text-[#3e7aef]" />
            </span>
            <p className="mt-3 max-w-[200px] text-[13px] text-[#55617c]">
              O histórico começa na primeira versão salva.
            </p>
          </div>
        ) : (
          <VersionTimeline
            versions={versions}
            currentVersion={currentVersion}
            onDiff={openDiff}
            onRestore={(v) => setRestoreTarget(v)}
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="pb-16">
      {/* ===== Header do editor ===== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-[60px] z-20 border-b border-[#e3e9f6] bg-[#f5f7fc]/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 px-6 py-3">
          <button
            type="button"
            aria-label="Voltar ao vault"
            onClick={() => guardNavigate(() => navigate('/app'))}
            className="rounded-lg p-2 text-[#55617c] transition-colors hover:bg-[#eaf0ff]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="text-xs text-[#55617c]">
            Vault /{' '}
            <span className="font-medium text-[#0b1020]">
              {form.title.trim() || 'Novo prompt'}
            </span>
          </p>
          {dirty ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#f2a63b]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#f2a63b]" />
              não salvo
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={handleImprove}
              className="bg-[#eaf0ff] text-[#3e7aef] hover:bg-[#dbe7ff]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Melhorar com IA
            </Button>
            <button
              type="button"
              aria-label="Copiar prompt"
              onClick={handleCopy}
              className="rounded-lg p-2 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 rounded-lg p-2 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef] xl:hidden"
            >
              <History className="h-4 w-4" />
              <span className="rounded-full bg-[#eaf0ff] px-1.5 text-[10px] font-semibold text-[#3e7aef]">
                {versions.length}
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais ações"
                  className="rounded-lg p-2 text-[#55617c] transition-colors hover:bg-[#eaf0ff] hover:text-[#3e7aef]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <CopyPlus className="mr-2 h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleVisibility}>
                  {form.visibility === 'public' ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Tornar privado
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" /> Tornar público
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Exportar .md
                </DropdownMenuItem>
                {!isNew ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmDelete(true)}
                      className="text-[#d64545] focus:text-[#d64545]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => save()}
              disabled={!dirty || saving}
              className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : savedFlash ? (
                <Check className="mr-2 h-4 w-4 text-[#b7f5e4]" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Salvar
              <kbd className="ml-2 hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline">
                ⌘S
              </kbd>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ===== Corpo ===== */}
      <div className="mx-auto flex max-w-[1100px] gap-6 px-6 pt-6">
        <div className="min-w-0 max-w-[760px] flex-1">
          {loadingExisting ? (
            <div className="space-y-5">
              <Skeleton className="h-9 w-[240px] bg-[#e3e9f6]/60" />
              <Skeleton className="h-10 w-full bg-[#e3e9f6]/60" />
              <Skeleton className="h-[320px] w-full rounded-xl bg-[#e3e9f6]/60" />
            </div>
          ) : (
            <motion.div
              key={shake}
              animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Nomeie seu prompt…"
                  className="w-full border-b-2 border-[#e3e9f6] bg-transparent pb-2 font-display text-2xl font-semibold tracking-tight text-[#0b1020] outline-none transition-colors placeholder:text-[#8b97b8] focus:border-[#3e7aef]"
                />
                {errors.title ? (
                  <p className="mt-1.5 text-[12.5px] text-[#d64545]">{errors.title}</p>
                ) : null}
              </motion.div>

              {/* Metadados */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-2"
              >
                <MetaPicker
                  label="Categoria"
                  value={form.category}
                  options={VAULT_CATEGORIES.map((c) => ({
                    id: c.id,
                    label: c.label,
                    color: c.color,
                  }))}
                  onChange={(v) => set('category', v ?? 'Outros')}
                  renderSelected={(id) => {
                    const c = getCategory(id)
                    return (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${c.color}1f`,
                          color: c.color,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.label}
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </span>
                    )
                  }}
                />

                <MetaPicker
                  label="Setor"
                  value={form.sector}
                  nullable
                  options={SECTOR_META.map((s) => ({
                    id: s.id,
                    label: s.label,
                    color: s.color,
                  }))}
                  onChange={(v) => set('sector', v)}
                  renderSelected={(id) => {
                    const s = getSectorMeta(id)
                    if (!s)
                      return (
                        <span className="flex items-center gap-1.5 rounded-full border border-[#e3e9f6] bg-white px-3 py-1.5 text-xs font-medium text-[#55617c]">
                          Setor: nenhum
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </span>
                      )
                    return (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${s.color}1f`,
                          color: s.color,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.label}
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </span>
                    )
                  }}
                />

                {/* Visibilidade */}
                <div className="flex overflow-hidden rounded-[10px] border border-[#e3e9f6]">
                  {(
                    [
                      { id: 'private', label: 'Privado', hint: 'só você vê', icon: Lock },
                      { id: 'public', label: 'Público', hint: 'aparece na comunidade', icon: Globe },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      title="Públicos podem ser descobertos por outros usuários; seu nome não é exibido."
                      onClick={() => set('visibility', v.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                        form.visibility === v.id
                          ? 'border-[#3e7aef] bg-[#eaf0ff] text-[#3e7aef]'
                          : 'bg-white text-[#55617c] hover:text-[#0b1020]',
                      )}
                    >
                      <v.icon className="h-3.5 w-3.5" />
                      {v.label}
                      <span className="hidden text-[10px] opacity-70 md:inline">
                        · {v.hint}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Favorito */}
                <button
                  type="button"
                  aria-label="Favoritar"
                  onClick={() => {
                    const next = !form.isFavorite
                    set('isFavorite', next)
                    if (!isNew) {
                      setBaseline((b) => ({ ...b, isFavorite: next }))
                      favMut.mutate({ id: promptId ?? 0 })
                    }
                  }}
                  className="rounded-full border border-[#e3e9f6] bg-white p-2 transition-colors hover:border-[#f2a63b]/50"
                >
                  <motion.span
                    key={String(form.isFavorite)}
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 0.25 }}
                    className="block"
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        form.isFavorite
                          ? 'fill-[#f2a63b] text-[#f2a63b]'
                          : 'text-[#8b97b8]',
                      )}
                    />
                  </motion.span>
                </button>
              </motion.div>

              {/* Conteúdo */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-[#e3e9f6] bg-white shadow-warm"
              >
                <div className="flex items-center gap-3 border-b border-[#e3e9f6] px-4 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55617c]">
                    Prompt
                  </span>
                  <span className="text-[11px] text-[#8b97b8]">
                    {form.content.length} caracteres · {words} palavras
                  </span>
                  <button
                    type="button"
                    onClick={insertVariable}
                    className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-[#3e7aef] transition-colors hover:bg-[#eaf0ff]"
                  >
                    <Braces className="h-3.5 w-3.5" />
                    Inserir variável
                  </button>
                </div>
                <div className="p-3">
                  <textarea
                    ref={textareaRef}
                    value={form.content}
                    onChange={(e) => set('content', e.target.value)}
                    placeholder={PLACEHOLDER}
                    style={{ minHeight: 320 }}
                    className="w-full resize-none overflow-hidden rounded-lg bg-[#f5f7fc]/60 p-3 font-mono text-sm leading-[1.65] text-[#0b1020] outline-none placeholder:text-[#8b97b8] focus:ring-2 focus:ring-[#3e7aef]/30"
                  />
                  {errors.content ? (
                    <p className="mt-1.5 px-1 text-[12.5px] text-[#d64545]">
                      {errors.content}
                    </p>
                  ) : null}
                  {variables.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-[#e3e9f6] px-1 pt-3">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#8b97b8]">
                        Variáveis
                      </span>
                      {variables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => jumpToVariable(v)}
                          title="Destacar no texto"
                          className="flex items-center gap-1 rounded-full bg-[#eaf0ff] px-2.5 py-1 font-mono text-[11.5px] font-medium text-[#3e7aef] transition-colors hover:bg-[#dbe7ff]"
                        >
                          <Braces className="h-3 w-3" />
                          {v}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* Nota de versão (edição) */}
              {!isNew ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="mb-1.5 text-[11px] text-[#8b97b8]">
                    Salvar cria a versão v{currentVersion + 1} — nada se perde.
                  </p>
                  <div className="relative">
                    <History className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b97b8]" />
                    <input
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      placeholder="O que mudou nesta versão? (ex.: ajustei o tom para ficar mais formal)"
                      className="h-10 w-full rounded-lg border border-[#e3e9f6] bg-white pl-9 pr-3 text-sm text-[#0b1020] outline-none placeholder:text-[#8b97b8] focus:border-[#3e7aef]/50 focus:ring-2 focus:ring-[#3e7aef]/20"
                    />
                  </div>
                </motion.div>
              ) : null}

              {/* Dicas para prompt novo */}
              <AnimatePresenceTips show={isNew && form.content.trim().length === 0} />
            </motion.div>
          )}
        </div>

        {/* Rail de versões (xl+) */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-[136px] hidden w-[300px] shrink-0 self-start xl:block"
        >
          {rail}
        </motion.aside>
      </div>

      {/* Drawer Histórico (mobile) */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Histórico de versões</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{rail}</div>
        </DrawerContent>
      </Drawer>

      {/* Diff */}
      <DiffModal
        open={diffPair !== null}
        onOpenChange={(o) => !o && setDiffPair(null)}
        from={diffPair?.from ?? null}
        to={diffPair?.to ?? null}
      />

      {/* Restaurar */}
      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Restaurar v{restoreTarget?.version}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo da v{restoreTarget?.version} vira uma nova versão v
              {currentVersion + 1}. Nada é apagado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-[#3e7aef] text-white hover:bg-[#2f5fd0]"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excluir */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{form.title || 'prompt'}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#d64545] text-white hover:bg-[#b93a3a]"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sair sem salvar */}
      <AlertDialog
        open={confirmLeave !== null}
        onOpenChange={(o) => !o && setConfirmLeave(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Sair mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = confirmLeave
                setConfirmLeave(null)
                action?.()
              }}
              className="bg-[#d64545] text-white hover:bg-[#b93a3a]"
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MetaPicker({
  label,
  value,
  options,
  onChange,
  nullable,
  renderSelected,
}: {
  label: string
  value: string | null
  options: { id: string; label: string; color: string }[]
  onChange: (id: string | null) => void
  nullable?: boolean
  renderSelected: (id: string | null) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className="outline-none">
          {renderSelected(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        {nullable ? (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors hover:bg-[#f5f7fc]',
              value === null ? 'font-semibold text-[#3e7aef]' : 'text-[#55617c]',
            )}
          >
            <span className="h-2 w-2 rounded-full bg-[#c6d2ec]" />
            Nenhum
          </button>
        ) : null}
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              onChange(o.id)
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors hover:bg-[#f5f7fc]',
              value === o.id ? 'font-semibold text-[#0b1020]' : 'text-[#55617c]',
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: o.color }}
            />
            {o.label}
            {value === o.id ? (
              <Check className="ml-auto h-3.5 w-3.5 text-[#3e7aef]" />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function AnimatePresenceTips({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl bg-[#eaf0ff] p-4"
    >
      <p className="flex items-center gap-2 text-[13px] font-semibold text-[#0b1020]">
        <Lightbulb className="h-4 w-4 text-[#3e7aef]" />
        Dicas rápidas
      </p>
      <ul className="mt-2 space-y-1.5">
        {NEW_TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-[13px] text-[#0b1020]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3e7aef]" />
            {tip}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
