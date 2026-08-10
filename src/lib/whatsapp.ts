const PLACEHOLDER_NUMBER = '5583999999999'

export function whatsappNumber(): string {
  const n = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined
  return n && n.trim().length > 0 ? n.trim() : PLACEHOLDER_NUMBER
}

/** Link wa.me com mensagem pré-preenchida para o CTA da oferta. */
export function whatsappLink(sectorLabel?: string): string {
  const message = sectorLabel
    ? `Olá! Usei o Melhore Meu Prompt (setor ${sectorLabel}) e quero saber mais sobre a biblioteca completa de prompts do meu setor, implantada na minha equipe por R$497.`
    : 'Olá! Usei o Melhore Meu Prompt e quero saber mais sobre a biblioteca completa de prompts por setor, implantada na minha equipe por R$497.'
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(message)}`
}
