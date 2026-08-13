import mysql from "mysql2/promise";
import "dotenv/config";

const S = (sector, title, content, tags, featured = false) => ({ sector, title, content, tags, featured });

const items = [
  // ===== Jurídico =====
  S("juridico", "Resposta inicial a cliente no WhatsApp", `Você é um advogado especialista em {área do direito} atendendo o primeiro contato de um cliente pelo WhatsApp.
Contexto: o cliente chegou com uma dúvida ou problema e ainda não sabe se precisa de advogado.
Tarefa: escreva uma resposta que (1) acolha a pessoa pelo nome, (2) enquadre o caso na área do direito correta em linguagem simples, (3) liste os documentos que ele deve separar, (4) termine com um convite claro para agendar uma consulta.
Formato: mensagem de WhatsApp, 4-6 linhas, tom humano e profissional, sem juridiquês.
Restrições: NUNCA cite artigos de lei ou jurisprudência sem que eu verifique antes; não prometa resultado; não dê parecer sobre o caso nesta mensagem.`, "atendimento,whatsapp", true),
  S("juridico", "Minuta de notificação extrajudicial", `Você é um advogado redigindo uma notificação extrajudicial.
Estruture em: (1) qualificação das partes com {placeholders} para os dados do caso, (2) contexto fático em ordem cronológica, (3) objetivo da notificação com prazo para resposta, (4) ressalvas legais finais.
Formato: documento formal, tom firme e respeitoso.
Restrições: use {placeholders} para qualquer dado que eu não forneci; não invente fatos, valores ou datas; marque com [VERIFICAR] qualquer referência legal que exija confirmação.`, "peças,documentos"),
  S("juridico", "E-mail de atualização de andamento", `Você é um advogado atualizando um cliente sobre o andamento do processo dele.
Tarefa: escreva um e-mail que (1) resuma o status atual em linguagem leiga (o que aconteceu e o que significa na prática), (2) liste os próximos passos com prazos estimados, (3) inclua a ressalva de que prazos processuais dependem do tribunal e serão verificados.
Formato: e-mail curto, parágrafos de 2-3 linhas, tom tranquilo e seguro.
Restrições: não use termos técnicos sem explicar entre parênteses; não garanta datas exatas de decisão judicial.`, "atendimento,email"),
  S("juridico", "Checklist de documentos por tipo de caso", `Você é um advogado organizando o atendimento inicial do escritório.
Tarefa: gere um checklist de documentos que o cliente precisa reunir para um caso de {área: trabalhista, consumidor ou família}.
Formato: lista com marcadores, agrupada por "Documentos pessoais", "Documentos do caso" e "Se houver"; linguagem simples, como se fosse para o cliente ler.
Restrições: inclua no final a frase "Traga o que tiver — o que faltar, a gente orienta como conseguir"; não peça documentos que exijam advogado para obter.`, "operações,checklist"),

  // ===== Estética & Beleza =====
  S("estetica", "Resposta a direct/WhatsApp pedindo preço", `Você é a recepcionista virtual de um studio de estética respondendo uma mensagem que pergunta "quanto custa?".
Tarefa: escreva uma resposta que (1) acolhe com carinho, (2) entrega valor antes do preço — explique que cada tratamento é personalizado e por quê, (3) convide para uma avaliação gratuita ou ofereça horários disponíveis.
Formato: mensagem de WhatsApp, 3-5 linhas, tom acolhedor e profissional, no máximo 1 emoji.
Restrições: não liste preços fechados; não use gatilhos de medo ou pressão; não prometa resultados estéticos garantidos.`, "whatsapp,vendas", true),
  S("estetica", "Legenda de Instagram antes/depois", `Você é a social media de um studio de estética criando a legenda de um post de antes/depois.
Tarefa: escreva uma legenda que (1) conte a mini-história do resultado (o que incomodava a cliente e como ela se sente agora, sem expor a pessoa), (2) conecte com bem-estar e autoestima, (3) termine com CTA para agendar pelo link da bio.
Formato: legenda de Instagram, 5-8 linhas, tom inspirador e real; inclua 5-8 hashtags do nicho ao final.
Restrições: não use "milagre", "garantido" ou promessas médicas; não exponha dados da cliente.`, "conteúdo,instagram"),
  S("estetica", "Mensagem de reagendamento de cliente sumida", `Você é a equipe de um studio de estética reativando uma cliente que não aparece há {tempo}.
Tarefa: escreva uma mensagem que (1) demonstre cuidado genuíno ("sentimos sua falta"), (2) lembre do último tratamento e do benefício de manter a rotina, (3) ofereça 2-3 opções de horário para facilitar o retorno.
Formato: WhatsApp, 3-4 linhas, tom carinhoso, zero cobrança.
Restrições: não mencione pagamento em aberto nesta mensagem; não use desconto agressivo — no máximo "uma condição especial de retorno".`, "whatsapp,reativação"),
  S("estetica", "Promoção do mês honesta", `Você é o marketing de um studio de estética lançando a promoção do mês.
Tarefa: crie o texto da campanha com (1) benefício claro do tratamento em destaque, (2) a condição real da promoção (o que inclui, até quando, para quantas vagas), (3) CTA direto para o WhatsApp.
Formato: texto único para WhatsApp/Instagram, 5-7 linhas.
Restrições: escassez apenas se for real; preço antigo só se foi praticado de verdade; sem "última chance" se a promoção volta mês que vem.`, "campanha,promoção"),

  // ===== Saúde & Clínicas =====
  S("saude", "Resposta a paciente sobre sintomas", `Você é a recepção de uma clínica respondendo um paciente que descreveu sintomas pelo WhatsApp.
Tarefa: escreva uma resposta que (1) acolha com empatia, (2) eduque brevemente SEM diagnosticar ("só a consulta pode avaliar isso com segurança"), (3) oriente o agendamento e informe quando procurar pronto atendimento se for o caso.
Formato: WhatsApp, 4-6 linhas, tom calmo e cuidadoso.
Restrições: NUNCA diagnostique, sugira medicação ou dose; nunca prometa resultado de tratamento; se os sintomas descritos indicarem urgência ({sintomas}), oriente atendimento imediato.`, "whatsapp,atendimento", true),
  S("saude", "Post educativo para Instagram", `Você é o social media de uma clínica criando um post educativo sobre {tema de saúde}.
Tarefa: estruture em "Mito vs. Fato": (1) apresente a crença comum, (2) explique o que a ciência diz em linguagem leiga, (3) termine com CTA para agendamento de consulta/avaliação.
Formato: legenda de Instagram, 6-10 linhas, tom didático e acolhedor.
Restrições: não cite estudos sem fonte verificável; inclua "este conteúdo não substitui consulta médica"; sem promessas de cura.`, "conteúdo,instagram"),
  S("saude", "Confirmação e lembrete de consulta", `Você é a recepção da clínica confirmando uma consulta agendada.
Tarefa: escreva a mensagem com (1) data, horário e profissional, (2) endereço/link e orientações práticas (chegar 15 min antes, documentos, preparo se houver), (3) política de remarcação gentil ("se precisar remarcar, nos avise com antecedência que a gente ajeita").
Formato: WhatsApp, 4-6 linhas, tom organizado e amigável.
Restrições: não multe nem ameace na mensagem; não inclua dados clínicos do paciente.`, "whatsapp,agenda"),
  S("saude", "E-mail pós-consulta de acompanhamento", `Você é a clínica enviando um e-mail de acompanhamento após a consulta.
Tarefa: escreva um e-mail que (1) agradeça a confiança, (2) reforce as orientações gerais dadas na consulta (usando {orientações} como placeholder), (3) sinalize quando deve ser o retorno e como agendar.
Formato: e-mail curto, tom profissional e humano.
Restrições: não inclua diagnóstico ou prescrição no e-mail; deixe claro que dúvidas clínicas devem ser tratadas em consulta ou contato direto.`, "atendimento,email"),

  // ===== Contabilidade =====
  S("contabilidade", "Lembrete de obrigação fiscal do mês", `Você é a contabilidade enviando o lembrete mensal de obrigação fiscal aos clientes.
Tarefa: escreva uma mensagem com (1) qual é a obrigação e o prazo ({data}), (2) o que o cliente precisa enviar e até quando, (3) a consequência do atraso explicada sem alarmismo (multa, juros — valores exatos só se confirmados), (4) CTA para enviar os documentos agora.
Formato: WhatsApp, 5-7 linhas, tom parceiro e organizado.
Restrições: não cite valores de multa sem {verificação}; não use CAPS nem excesso de exclamações.`, "whatsapp,fiscal", true),
  S("contabilidade", "E-mail de diagnóstico gratuito", `Você é um contador prospectando empresários com a oferta de um diagnóstico gratuito.
Tarefa: escreva um e-mail que (1) nomeie a dor do empresário (pagar imposto demais, medo de fiscalização, bagunça fiscal), (2) explique o que o diagnóstico cobre em 3 bullets, (3) CTA para agendar 20 minutos.
Formato: e-mail de vendas, 6-8 linhas, tom consultivo, sem pressão.
Restrições: não prometa economia específica ("reduza X% de imposto") — fale em "identificar oportunidades"; não deprecie o contador atual do lead.`, "vendas,email"),
  S("contabilidade", "Explicador de enquadramento tributário", `Você é um contador criando conteúdo educativo sobre enquadramento tributário.
Tarefa: explique Simples Nacional vs. Lucro Presumido para um empresário leigo: (1) o que muda na prática, (2) para quem costuma fazer sentido cada um, (3) por que a escolha certa depende dos números do negócio — CTA para diagnóstico.
Formato: post/carrossel ou e-mail, 8-12 linhas, linguagem simples com exemplos.
Restrições: não garanta economia; inclua "cada caso precisa de análise individual"; alíquotas apenas com {verificação} ou como exemplo genérico.`, "conteúdo,educativo"),
  S("contabilidade", "Cobrança amigável de documentos pendentes", `Você é a contabilidade cobrando documentos pendentes de um cliente.
Tarefa: escreva uma mensagem que (1) liste com clareza os documentos que faltam, (2) explique o prazo e o que trava sem eles, (3) mantenha tom parceiro ("qualquer dificuldade, a gente ajuda").
Formato: WhatsApp, 4-6 linhas com lista.
Restrições: sem tom de bronca; não ameace rescisão; ofereça um canal para tirar dúvidas.`, "atendimento,whatsapp"),

  // ===== Imobiliário =====
  S("imobiliario", "Descrição de imóvel que vende estilo de vida", `Você é um copywriter imobiliário escrevendo o anúncio de {tipo de imóvel} em {bairro}.
Tarefa: (1) abra com uma cena de vida no imóvel (o café da manhã na varanda, as crianças no quintal) ANTES das especificações, (2) apresente o bairro como benefício (padaria a 2 min, escola, parque), (3) liste as specs essenciais em bullets, (4) CTA para agendar visita.
Formato: anúncio para portal/Instagram, 8-12 linhas.
Restrições: não exagere metragens ou distâncias — use {placeholders} quando não souber; não prometa valorização.`, "anúncios,vendas", true),
  S("imobiliario", "Resposta rápida a lead de portal", `Você é um corretor respondendo um lead que veio de portal imobiliário (ZAP/VivaReal).
Tarefa: escreva uma resposta para ser enviada em menos de 5 minutos: (1) agradeça e confirme que o imóvel está disponível, (2) faça 2 perguntas de qualificação (o que procura, prazo de mudança), (3) proponha visita com 2 opções de horário.
Formato: WhatsApp, 4-5 linhas, tom consultivo, não vendedor.
Restrições: não despeje a ficha técnica inteira; não pergunte mais de 2 coisas; não peça documentos neste primeiro contato.`, "whatsapp,leads"),
  S("imobiliario", "Follow-up pós-visita", `Você é o corretor fazendo follow-up com um cliente que visitou o imóvel {referência}.
Tarefa: escreva uma mensagem que (1) reforce o que o cliente mais elogiou na visita ({elogio}), (2) quebre 1 objeção comum de forma leve (preço, localização ou tamanho — escolha a relevante), (3) proponha o próximo passo concreto (segunda visita, proposta, conversa com a família).
Formato: WhatsApp, 4-6 linhas, tom próximo e paciente.
Restrições: sem pressão artificial ("tem outro interessado" só se for verdade); não mande mais de 1 follow-up sem resposta.`, "whatsapp,follow-up"),
  S("imobiliario", "Post de oportunidade do bairro", `Você é o marketing de uma imobiliária criando um post sobre {bairro}.
Tarefa: (1) abra com um dado ou fato local interessante (novo comércio, valorização, infraestrutura — usar {dado} como placeholder se não tiver), (2) conecte com o estilo de vida do bairro, (3) apresente 1 imóvel disponível como "gancho", (4) CTA para visita.
Formato: legenda de Instagram/Facebook, 6-8 linhas.
Restrições: dados de valorização apenas com fonte {verificar}; não prometa retorno de investimento.`, "conteúdo,local"),

  // ===== E-commerce & Varejo =====
  S("ecommerce", "Descrição de produto orientada a benefício", `Você é um copywriter de e-commerce escrevendo a descrição de {produto}.
Tarefa: estruture em (1) benefício principal em uma frase (o que muda na vida do cliente), (2) prova/argumentos (material, garantia, avaliações), (3) especificações técnicas em bullets, (4) responda a objeção mais comum ({objeção}), (5) CTA de compra.
Formato: descrição de produto para loja virtual, 8-12 linhas.
Restrições: não invente selos, prêmios ou avaliações; specs apenas com {dados reais}; sem superlativos não comprováveis ("o melhor do Brasil").`, "produto,copy", true),
  S("ecommerce", "Recuperação de carrinho no WhatsApp", `Você é o atendimento de uma loja virtual recuperando um carrinho abandonado.
Tarefa: escreva uma mensagem que (1) ajude primeiro ("ficou alguma dúvida sobre o produto ou o frete?"), (2) mencione o item deixado no carrinho, (3) urgência honesta apenas se houver (estoque real, fim de promoção real), (4) ofereça cupom opcional como último recurso.
Formato: WhatsApp, 3-5 linhas, tom prestativo.
Restrições: não finja escassez; não mande mais de 2 mensagens de recuperação; respeite opt-out imediato.`, "atendimento,recuperação"),
  S("ecommerce", "Campanha relâmpago de fim de semana", `Você é o marketing da loja criando uma campanha relâmpago de fim de semana.
Tarefa: crie o texto com (1) mecânica simples (X% OFF ou frete grátis em {categoria}), (2) prazo real com data e hora de fim, (3) tom promocional direto, (4) CTA com link.
Formato: texto para WhatsApp broadcast + stories, 4-6 linhas.
Restrições: desconto real sobre preço praticado; prazo real; não use "corre" mais de uma vez.`, "campanha,promoção"),
  S("ecommerce", "Resposta a avaliação negativa", `Você é o atendimento respondendo uma avaliação negativa pública ({canal}: Google, Instagram, marketplace).
Tarefa: escreva uma resposta que (1) agradeça o feedback sinceramente, (2) reconheça o problema sem se defender, (3) informe a ação tomada ou proposta, (4) convide para resolver no privado com contato direto.
Formato: resposta pública, 3-5 linhas, tom maduro e profissional.
Restrições: nunca culpe o cliente; não discuta detalhes do caso publicamente; não peça para remover a avaliação.`, "atendimento,reputação"),
];

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [existing] = await conn.query("SELECT COUNT(*) AS n FROM library_items");
if (Number(existing[0].n) > 0) {
  console.log("library_items já populada — pulando seed");
} else {
  for (const it of items) {
    await conn.query(
      "INSERT INTO library_items (sector, title, content, tags, featured) VALUES (?, ?, ?, ?, ?)",
      [it.sector, it.title, it.content, it.tags, it.featured ? 1 : 0]
    );
  }
  console.log(`Seed OK: ${items.length} itens de biblioteca inseridos`);
}
await conn.end();
