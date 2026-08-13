import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import {
  createArtifact,
  createPrompt,
  deleteArtifact,
  deletePrompt,
  getPrompt,
  listArtifacts,
  listLibraryItems,
  listPrompts,
  listPromptVersions,
  promptStats,
  savePromptVersion,
  toggleFavoritePrompt,
  updateArtifact,
} from "./queries/vault";

const idInput = z.object({ id: z.number().int().positive() });

export const vaultRouter = createRouter({
  // ===== Prompts =====
  list: authedQuery
    .input(
      z
        .object({
          q: z.string().max(200).optional(),
          category: z.string().max(64).optional(),
          visibility: z.enum(["public", "private"]).optional(),
          favoritesOnly: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => listPrompts(ctx.user.unionId, input)),

  get: authedQuery.input(idInput).query(async ({ ctx, input }) => {
    const p = await getPrompt(input.id, ctx.user.unionId);
    if (!p) throw new Error("Prompt não encontrado");
    return p;
  }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        category: z.string().max(64).optional(),
        sector: z.string().max(64).optional(),
        visibility: z.enum(["public", "private"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => createPrompt(ctx.user.unionId, input)),

  save: authedQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        category: z.string().max(64).optional(),
        sector: z.string().max(64).nullable().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        changeNote: z.string().max(500).optional(),
        source: z.enum(["manual", "ai"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const p = await savePromptVersion(id, ctx.user.unionId, data);
      if (!p) throw new Error("Prompt não encontrado");
      return p;
    }),

  toggleFavorite: authedQuery.input(idInput).mutation(async ({ ctx, input }) => {
    const p = await toggleFavoritePrompt(input.id, ctx.user.unionId);
    if (!p) throw new Error("Prompt não encontrado");
    return p;
  }),

  remove: authedQuery.input(idInput).mutation(async ({ ctx, input }) => {
    const ok = await deletePrompt(input.id, ctx.user.unionId);
    if (!ok) throw new Error("Prompt não encontrado");
    return { ok: true };
  }),

  versions: authedQuery.input(z.object({ promptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const v = await listPromptVersions(input.promptId, ctx.user.unionId);
    if (!v) throw new Error("Prompt não encontrado");
    return v;
  }),

  stats: authedQuery.query(async ({ ctx }) => promptStats(ctx.user.unionId)),

  // ===== Artifacts =====
  listArtifacts: authedQuery
    .input(z.object({ q: z.string().max(200).optional() }).optional())
    .query(async ({ ctx, input }) => listArtifacts(ctx.user.unionId, input?.q)),

  createArtifact: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        type: z.enum(["html", "code", "text"]).optional(),
        language: z.string().max(32).optional(),
        code: z.string().min(1),
        promptId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => createArtifact(ctx.user.unionId, input)),

  updateArtifact: authedQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(500).optional(),
        type: z.enum(["html", "code", "text"]).optional(),
        language: z.string().max(32).optional(),
        code: z.string().min(1).optional(),
        isFavorite: z.boolean().optional(),
        promptId: z.number().int().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const a = await updateArtifact(id, ctx.user.unionId, data);
      if (!a) throw new Error("Artefato não encontrado");
      return a;
    }),

  deleteArtifact: authedQuery.input(idInput).mutation(async ({ ctx, input }) => {
    const ok = await deleteArtifact(input.id, ctx.user.unionId);
    if (!ok) throw new Error("Artefato não encontrado");
    return { ok: true };
  }),
});

// Biblioteca pública (leitura aberta; escrita futura via admin)
export const libraryRouter = createRouter({
  list: publicQuery
    .input(z.object({ sector: z.string().max(64).optional() }).optional())
    .query(async ({ input }) => listLibraryItems(input?.sector)),
});
