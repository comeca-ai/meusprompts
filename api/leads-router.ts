import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { insertLeadEvent, upsertLeadProfile, getLeadStats } from "./queries/leads";
import { userOwnerKey } from "./queries/users";

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
      userId: ctx.user ? userOwnerKey(ctx.user) : null,
    });
    return { ok: true };
  }),

  // Autenticado: salva setor de interesse do lead
  saveMySector: authedQuery
    .input(z.object({ sector: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      await upsertLeadProfile(userOwnerKey(ctx.user), input.sector);
      return { ok: true };
    }),

  // Admin: painel /dados (contém PII de todos os usuários)
  stats: adminQuery.query(async () => getLeadStats()),
});
