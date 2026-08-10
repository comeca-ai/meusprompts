import { getSector } from './sectors'

export interface ImproveResult {
  improved: string
  changes: string[]
  sectorTip: string
  /** 'ai' = OpenRouter · 'demo' = melhorador local (sem chave) */
  source: 'ai' | 'demo'
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const META_PROMPT = `Você é um engenheiro de prompts sênior, especialista em pequenas e médias empresas brasileiras. Reescreva o prompt do usuário aplicando o playbook do setor {SETOR}. Regras: responda APENAS JSON válido no formato {"improved": string, "changes": string[2..3], "sectorTip": string}. 'improved' é o prompt reescrito em PT-BR, pronto para colar no ChatGPT/Claude/Gemini, com papel, contexto, formato de saída e restrições. 'changes' explica em linguagem simples o que mudou e por quê. 'sectorTip' é 1 dica prática do setor. Nunca invente leis, dados ou promessas. Setor: {PLAYBOOK}`

function buildSystemPrompt(sectorId: string): string {
  const sector = getSector(sectorId)
  return META_PROMPT.replace('{SETOR}', sector.label).replace(
    '{PLAYBOOK}',
    sector.playbook,
  )
}

/** Melhorador local baseado em regras — usado quando não há chave OpenRouter. */
function demoImprove(prompt: string, sectorId: string): ImproveResult {
  const sector = getSector(sectorId)
  const trimmed = prompt.trim()
  const improved = [
    `Aja como ${sector.demoRole}.`,
    '',
    `Minha empresa atua no setor de ${sector.label}. Preciso da sua ajuda com o seguinte pedido:`,
    `"${trimmed}"`,
    '',
    'Estruture sua resposta assim:',
    sector.demoStructure,
    '',
    'Restrições importantes:',
    sector.demoConstraints,
    '',
    'Escreva em português brasileiro, pronto para eu usar sem edição.',
  ].join('\n')

  return {
    improved,
    changes: [...sector.demoChanges],
    sectorTip: sector.demoTip,
    source: 'demo',
  }
}

/** Extrai o primeiro objeto JSON {...} de uma resposta (tolera code fences). */
function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```(?:json)?/gi, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('A IA não retornou JSON válido.')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

function parseAiResult(data: unknown): Omit<ImproveResult, 'source'> {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Resposta da IA em formato inesperado.')
  }
  const obj = data as Record<string, unknown>
  if (typeof obj.improved !== 'string' || obj.improved.trim().length === 0) {
    throw new Error('Resposta da IA sem o prompt melhorado.')
  }
  const changes = Array.isArray(obj.changes)
    ? obj.changes.filter((c): c is string => typeof c === 'string').slice(0, 3)
    : []
  return {
    improved: obj.improved.trim(),
    changes:
      changes.length > 0
        ? changes
        : ['A IA reescreveu seu prompt aplicando o playbook do setor.'],
    sectorTip:
      typeof obj.sectorTip === 'string' && obj.sectorTip.trim().length > 0
        ? obj.sectorTip.trim()
        : 'Teste o prompt melhorado e ajuste os detalhes do seu negócio.',
  }
}

async function callOpenRouter(
  prompt: string,
  sectorId: string,
  apiKey: string,
): Promise<ImproveResult> {
  const model =
    import.meta.env.VITE_OPENROUTER_MODEL ||
    'meta-llama/llama-3.3-70b-instruct:free'

  let response: Response
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Melhore Meu Prompt',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(sectorId) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    })
  } catch {
    throw new Error('Sem conexão com a IA. Verifique sua internet e tente de novo.')
  }

  if (!response.ok) {
    throw new Error(
      `A IA retornou erro (${response.status}). Tente de novo em instantes.`,
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('A IA não retornou conteúdo. Tente de novo.')
  }

  const parsed = parseAiResult(extractJson(content))
  return { ...parsed, source: 'ai' }
}

/**
 * Única função de melhoria de prompt da aplicação.
 * Isolada aqui para que, no futuro, basta apontar para um Cloudflare Worker
 * sem refatorar a UI.
 */
export async function improvePrompt(
  prompt: string,
  sectorId: string,
): Promise<ImproveResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
  if (!apiKey || apiKey.trim().length === 0) {
    // Simula uma pequena latência para o modo demonstração parecer processamento real
    await new Promise((resolve) => setTimeout(resolve, 900))
    return demoImprove(prompt, sectorId)
  }
  return callOpenRouter(prompt, sectorId, apiKey.trim())
}

export function isDemoMode(): boolean {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
  return !apiKey || apiKey.trim().length === 0
}
