import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { insertLeadEvent, upsertLeadProfile, getLeadStats } from "./queries/leads";

const eventInput = z.object({
  type: z.enum(["use", "gate_login", "cta_whatsapp"]),
  sector: z.string().max(64).optional(),
});

export const leadsRouter = createRouter({
  // Público: registra uso anônimo ou autenticado (sensor de demanda)
  logEvent: publicQuery.input(eventInput).mutation(async ({ ctx, input }) => {
    await insertLeadEvent({
      type: input.type,
      sector: input.sector ?? null,
      userId: ctx.user?.unionId ?? null,
    });
    return { ok: true };
  }),

  // Autenticado: salva setor de interesse do lead
  saveMySector: authedQuery
    .input(z.object({ sector: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      await upsertLeadProfile(ctx.user.unionId, input.sector);
      return { ok: true };
    }),

  // Autenticado: painel /dados (dono logado)
  stats: authedQuery.query(async () => getLeadStats()),
});
