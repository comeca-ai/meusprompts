import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { AppShell, EmptyState } from '@/components/app'
import { getSectorMeta } from '@/lib/vault'

/** Stub de /app/biblioteca e /app/biblioteca/:setor — outro agente implementa a página completa. */
export function LibraryStub() {
  const navigate = useNavigate()
  const { setor } = useParams()
  const meta = getSectorMeta(setor)
  return (
    <AppShell
      title={meta ? `Biblioteca · ${meta.label}` : 'Biblioteca'}
      subtitle="Playbooks e prompts-semente curados por setor"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="rounded-xl border border-[#e3e9f6] bg-white shadow-warm">
          <EmptyState
            image="/empty-search.svg"
            title="Em construção"
            description={
              meta
                ? `A biblioteca de ${meta.label} está sendo preparada com playbooks e prompts prontos para salvar no seu vault.`
                : 'A biblioteca pública por setor está sendo preparada com playbooks e prompts prontos para salvar no seu vault.'
            }
            primaryAction={{
              label: 'Voltar ao vault',
              icon: <ArrowLeft className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/app'),
            }}
            secondaryAction={{
              label: 'Novo prompt',
              icon: <BookOpen className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/app/prompts/novo'),
            }}
          />
        </div>
      </div>
    </AppShell>
  )
}
