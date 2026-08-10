import type { LucideIcon } from 'lucide-react'
import {
  Scale,
  Sparkles,
  HeartPulse,
  Calculator,
  Building2,
  ShoppingCart,
} from 'lucide-react'

export interface Sector {
  id: string
  label: string
  icon: LucideIcon
  /** Playbook-semente injetado no system prompt da OpenRouter */
  playbook: string
  /** Papel usado na reescrita local (modo demonstração) */
  demoRole: string
  /** Estrutura recomendada ao reescrever (modo demonstração) */
  demoStructure: string
  /** Restrições aplicadas ao redor do prompt (modo demonstração) */
  demoConstraints: string
  /** Bullets templateados "o que mudou e por quê" (modo demonstração) */
  demoChanges: [string, string, string]
  /** Dica prática do setor (modo demonstração) */
  demoTip: string
}

export const SECTORS: Sector[] = [
  {
    id: 'juridico',
    label: 'Jurídico',
    icon: Scale,
    playbook:
      'Papel de advogado especialista; tom formal-técnico; estruturar em contexto do caso → objetivo → peça/ato desejado → ressalvas; PROIBIR invenção de jurisprudência, números de processos ou artigos de lei específicos — orientar a verificar fontes oficiais.',
    demoRole:
      'um advogado sênior brasileiro, especialista na área relacionada ao pedido, com tom formal-técnico e linguagem precisa',
    demoStructure:
      '1) Contexto do caso (fatos relevantes, partes e momento processual)\n2) Objetivo (o que se quer alcançar)\n3) Peça/ato desejado (tipo de documento ou resposta esperada)\n4) Ressalvas e pontos de atenção',
    demoConstraints:
      'NÃO invente jurisprudência, números de processos ou artigos de lei específicos. Sempre que citar fundamento legal, sinalize que devo verificar a fonte oficial (planalto.gov.br, tribunais) antes de usar.',
    demoChanges: [
      'Adicionamos o papel de advogado especialista: a IA responde com tom formal-técnico em vez de genérico.',
      'Estruturamos o pedido em contexto → objetivo → peça desejada → ressalvas, que é como um parecer profissional se organiza.',
      'Incluímos uma trava de segurança: a IA fica proibida de inventar leis, artigos ou jurisprudência — erro comum e perigoso no jurídico.',
    ],
    demoTip:
      'Sempre peça à IA para listar o que ela NÃO tem certeza — assim você sabe exatamente o que conferir nas fontes oficiais.',
  },
  {
    id: 'estetica',
    label: 'Estética & Beleza',
    icon: Sparkles,
    playbook:
      'Tom acolhedor e vendedor; linguagem simples; foco em WhatsApp e agendamento; gatilhos de antes/depois e bem-estar; emojis com moderação; CTA sempre para marcar horário.',
    demoRole:
      'uma copywriter especialista em clínicas de estética e salões de beleza brasileiros, com tom acolhedor, vendedor e linguagem simples',
    demoStructure:
      '1) Gancho de bem-estar ou antes/depois\n2) Benefício principal em linguagem simples\n3) Prova ou detalhe que gera confiança\n4) CTA para marcar horário pelo WhatsApp',
    demoConstraints:
      'Use no máximo 2 emojis por texto. Termine SEMPRE com um convite para agendar horário pelo WhatsApp. Nunca prometa resultados garantidos.',
    demoChanges: [
      'Definimos um papel de copywriter de estética: o texto sai acolhedor e vendedor, não robótico.',
      'Incluímos gatilhos de antes/depois e bem-estar, que são o que realmente move cliente de estética.',
      'Fechamos com CTA para marcar horário no WhatsApp — sem isso, o conteúdo não vira agendamento.',
    ],
    demoTip:
      'Peça 3 variações do mesmo texto e teste uma por semana: o agendamento mostra qual tom funciona no seu público.',
  },
  {
    id: 'saude',
    label: 'Saúde & Clínicas',
    icon: HeartPulse,
    playbook:
      'Tom profissional e empático; NUNCA prometer resultado médico nem substituir consulta; foco em educação do paciente e agendamento; cuidado com termos técnicos.',
    demoRole:
      'um redator de comunicação de clínicas e consultórios brasileiros, com tom profissional, empático e cuidadoso com termos técnicos',
    demoStructure:
      '1) Acolhimento da dúvida ou dor do paciente\n2) Informação educativa em linguagem acessível\n3) Aviso de que o conteúdo não substitui consulta\n4) Convite para avaliação/agendamento',
    demoConstraints:
      'NUNCA prometa resultado médico, cura ou prazo de melhora. NUNCA substitua consulta ou diagnóstico. Explique termos técnicos entre parênteses quando forem necessários.',
    demoChanges: [
      'Ajustamos o tom para profissional e empático — essencial para gerar confiança em saúde.',
      'Colocamos barreiras explícitas: a IA não pode prometer resultado médico nem substituir consulta (protege você e o paciente).',
      'Direcionamos o conteúdo para educar o paciente e levar ao agendamento, que é o objetivo comercial da clínica.',
    ],
    demoTip:
      'Use a IA para transformar as dúvidas mais comuns da recepção em posts educativos — é o conteúdo que mais atrai paciente qualificado.',
  },
  {
    id: 'contabilidade',
    label: 'Contabilidade',
    icon: Calculator,
    playbook:
      'Tom de confiança e clareza; foco em prazos, obrigações fiscais e economia legal; CTA para diagnóstico gratuito; evitar garantias de economia específica.',
    demoRole:
      'um contador consultivo brasileiro que traduz obrigações fiscais para linguagem de dono de pequena empresa, com tom de confiança e clareza',
    demoStructure:
      '1) Contexto (obrigação, prazo ou dor do empresário)\n2) Explicação clara do que precisa ser feito\n3) Riscos de não agir (multas, malha) sem alarmismo\n4) CTA para um diagnóstico gratuito',
    demoConstraints:
      'NÃO garanta valores ou percentuais específicos de economia. Fale em "economia legal possível" e recomende análise do caso concreto.',
    demoChanges: [
      'Demos à IA o papel de contador consultivo: respostas com confiança e clareza, sem juridiquês fiscal.',
      'Focamos em prazos e obrigações — o que realmente tira o sono do pequeno empresário.',
      'Adicionamos o cuidado de não prometer economia específica, evitando expectativa que você não pode cumprir.',
    ],
    demoTip:
      'Peça à IA um calendário mensal das obrigações do seu regime tributário e transforme cada data em um lembrete para clientes.',
  },
  {
    id: 'imobiliario',
    label: 'Imobiliário',
    icon: Building2,
    playbook:
      'Descrições que vendem estilo de vida, não só metros quadrados; respostas rápidas a leads; gatilhos de visita; tom consultivo.',
    demoRole:
      'um corretor de imóveis consultivo brasileiro, que vende estilo de vida e não apenas metros quadrados',
    demoStructure:
      '1) Cena de vida (como é morar ali, bairro, rotina)\n2) Características do imóvel ligadas a benefícios\n3) Gatilho de escassez ou oportunidade honesta\n4) Convite para visita ou conversa rápida',
    demoConstraints:
      'Responda leads em no máximo 5 linhas e sempre proponha visita. Não invente dados do imóvel (metragem, valor, vagas) — use placeholders [entre colchetes] quando a informação não estiver no pedido.',
    demoChanges: [
      'Trocamos "características" por "estilo de vida": é isso que faz o lead se imaginar morando no imóvel.',
      'Adicionamos resposta rápida a leads com proposta de visita — velocidade é o que converte no imobiliário.',
      'Proibimos a IA de inventar metragem, valor ou vagas: ela marca placeholders para você preencher.',
    ],
    demoTip:
      'Cole as respostas mais comuns dos leads (financiamento, documentação, bairro) e peça à IA um modelo de resposta para cada uma.',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce & Varejo',
    icon: ShoppingCart,
    playbook:
      'Descrições de produto orientadas a benefício; campanhas com urgência honesta; atendimento que recupera carrinho; tom direto e promocional.',
    demoRole:
      'um copywriter de e-commerce brasileiro, direto e promocional, focado em benefício para o cliente e em recuperação de vendas',
    demoStructure:
      '1) Benefício principal em uma frase\n2) 3 a 5 benefícios em bullets (não características técnicas)\n3) Urgência honesta (estoque, prazo real)\n4) CTA de compra ou recuperação de carrinho',
    demoConstraints:
      'Urgência deve ser honesta: use placeholders [entre colchetes] para estoque e prazo em vez de inventar números. Nada de "últimas unidades" falso.',
    demoChanges: [
      'Reorientamos o texto para benefícios, não características: o cliente compra o que o produto faz por ele.',
      'Incluímos urgência honesta com placeholders — converte sem queimar a confiança da sua loja.',
      'Adicionamos estrutura de recuperação de carrinho, a receita que a maioria das lojas deixa na mesa.',
    ],
    demoTip:
      'Peça à IA 5 títulos diferentes para o mesmo produto e use o melhor no anúncio — título é metade da venda.',
  },
]

export const DEFAULT_SECTOR = SECTORS[0]

export function getSector(id: string): Sector {
  return SECTORS.find((s) => s.id === id) ?? DEFAULT_SECTOR
}
