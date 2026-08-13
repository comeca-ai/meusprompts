/**
 * Conteúdo editorial da Biblioteca pública por setor (app-biblioteca.md).
 * Taglines e bullets dos playbooks derivados de src/lib/sectors.ts / info.md.
 */

/** Forma estrutural de um item da biblioteca (espelha db/schema.ts `library_items`). */
export interface LibraryItemData {
  id: number
  sector: string
  title: string
  content: string
  /** csv */
  tags: string | null
  featured: boolean
}

export interface SectorLibraryContent {
  tagline: string
  /** Bullets "O que um bom prompt de {setor} precisa" (app-biblioteca.md §2.1) */
  bullets: string[]
}

export const SECTOR_LIBRARY_CONTENT: Record<string, SectorLibraryContent> = {
  juridico: {
    tagline: 'Peças, pareceres e atendimento com rigor técnico.',
    bullets: [
      'Papel de advogado especialista e tom formal-técnico',
      'Estrutura: contexto do caso → objetivo → peça desejada → ressalvas',
      'Proibido inventar jurisprudência, números de processo ou artigos',
      'Sempre orientar a verificar fontes oficiais',
    ],
  },
  estetica: {
    tagline: 'WhatsApp que acolhe e agenda cheia.',
    bullets: [
      'Tom acolhedor e vendedor, linguagem simples',
      'Foco em WhatsApp e agendamento',
      'Gatilhos de antes/depois e bem-estar, emoji com moderação',
      'CTA sempre para marcar horário',
    ],
  },
  saude: {
    tagline: 'Educação do paciente sem prometer resultado.',
    bullets: [
      'Tom profissional e empático',
      'Nunca prometer resultado médico nem substituir consulta',
      'Foco em educação do paciente e agendamento',
      'Cuidado com termos técnicos',
    ],
  },
  contabilidade: {
    tagline: 'Prazos, obrigações e economia legal com clareza.',
    bullets: [
      'Tom de confiança e clareza',
      'Foco em prazos, obrigações fiscais e economia legal',
      'CTA para diagnóstico gratuito',
      'Sem garantias de economia específica',
    ],
  },
  imobiliario: {
    tagline: 'Descrições que vendem estilo de vida.',
    bullets: [
      'Descrições que vendem estilo de vida, não só m²',
      'Resposta rápida a leads',
      'Gatilhos de visita',
      'Tom consultivo',
    ],
  },
  ecommerce: {
    tagline: 'Produto, campanha e carrinho recuperado.',
    bullets: [
      'Descrição orientada a benefício',
      'Urgência honesta nas campanhas',
      'Atendimento que recupera carrinho',
      'Tom direto e promocional',
    ],
  },
}

/** Quebra o csv de tags em lista limpa. */
export function parseTags(tags: string | null | undefined): string[] {
  return (tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

/**
 * Categoria sugerida do vault ao salvar um item da biblioteca
 * (app-biblioteca.md §2.2): atendimento/whatsapp → Atendimento;
 * post/legenda/e-mail → Marketing & Conteúdo; proposta/orçamento/follow-up →
 * Vendas & Propostas; demais → Operações.
 */
export function suggestVaultCategory(item: {
  title: string
  tags: string | null
}): string {
  const hay = `${item.title} ${item.tags ?? ''}`.toLowerCase()
  if (/(atendimento|whatsapp)/.test(hay)) return 'Atendimento'
  if (/(post|legenda|e-mail|email)/.test(hay)) return 'Marketing & Conteúdo'
  if (/(proposta|orçamento|orcamento|follow-up)/.test(hay))
    return 'Vendas & Propostas'
  return 'Operações'
}
