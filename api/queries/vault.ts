import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { artifacts, libraryItems, promptVersions, prompts } from "../../db/schema";

// ===== Prompts (vault) =====

export async function listPrompts(
  userId: string,
  opts?: { q?: string; category?: string; visibility?: string; favoritesOnly?: boolean }
) {
  const db = getDb();
  const conds = [eq(prompts.userId, userId)];
  if (opts?.q) {
    const term = `%${opts.q}%`;
    conds.push(or(like(prompts.title, term), like(prompts.content, term))!);
  }
  if (opts?.category) conds.push(eq(prompts.category, opts.category));
  if (opts?.visibility) conds.push(eq(prompts.visibility, opts.visibility));
  if (opts?.favoritesOnly) conds.push(eq(prompts.isFavorite, true));
  return db.select().from(prompts).where(and(...conds)).orderBy(desc(prompts.updatedAt));
}

export async function getPrompt(id: number, userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(prompts)
    .where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPrompt(
  userId: string,
  data: { title: string; content: string; category?: string; sector?: string; visibility?: string }
) {
  const db = getDb();
  const res = await db.insert(prompts).values({
    userId,
    title: data.title,
    content: data.content,
    category: data.category ?? "Geral",
    sector: data.sector ?? null,
    visibility: data.visibility ?? "private",
    currentVersion: 1,
  });
  const id = Number(res[0].insertId);
  await db.insert(promptVersions).values({
    promptId: id,
    version: 1,
    title: data.title,
    content: data.content,
    changeNote: "Versão inicial",
    source: "manual",
  });
  return getPrompt(id, userId);
}

/** Salvar = sempre nova versão. currentVersion aponta para a última. */
export async function savePromptVersion(
  id: number,
  userId: string,
  data: {
    title: string;
    content: string;
    category?: string;
    sector?: string | null;
    visibility?: string;
    changeNote?: string;
    source?: "manual" | "ai";
  }
) {
  const db = getDb();
  const existing = await getPrompt(id, userId);
  if (!existing) return null;
  const nextVersion = existing.currentVersion + 1;
  await db.insert(promptVersions).values({
    promptId: id,
    version: nextVersion,
    title: data.title,
    content: data.content,
    changeNote: data.changeNote ?? null,
    source: data.source ?? "manual",
  });
  await db
    .update(prompts)
    .set({
      title: data.title,
      content: data.content,
      category: data.category ?? existing.category,
      sector: data.sector === undefined ? existing.sector : data.sector,
      visibility: data.visibility ?? existing.visibility,
      currentVersion: nextVersion,
    })
    .where(eq(prompts.id, id));
  return getPrompt(id, userId);
}

export async function toggleFavoritePrompt(id: number, userId: string) {
  const db = getDb();
  const existing = await getPrompt(id, userId);
  if (!existing) return null;
  await db.update(prompts).set({ isFavorite: !existing.isFavorite }).where(eq(prompts.id, id));
  return getPrompt(id, userId);
}

export async function deletePrompt(id: number, userId: string) {
  const db = getDb();
  const existing = await getPrompt(id, userId);
  if (!existing) return false;
  await db.delete(promptVersions).where(eq(promptVersions.promptId, id));
  await db.delete(prompts).where(eq(prompts.id, id));
  return true;
}

export async function listPromptVersions(promptId: number, userId: string) {
  const owner = await getPrompt(promptId, userId);
  if (!owner) return null;
  const db = getDb();
  return db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.version));
}

export async function promptStats(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      total: sql<number>`count(*)`,
      favorites: sql<number>`sum(case when ${prompts.isFavorite} then 1 else 0 end)`,
      publics: sql<number>`sum(case when ${prompts.visibility} = 'public' then 1 else 0 end)`,
      privates: sql<number>`sum(case when ${prompts.visibility} = 'private' then 1 else 0 end)`,
    })
    .from(prompts)
    .where(eq(prompts.userId, userId));
  const r = rows[0];
  return {
    total: Number(r?.total ?? 0),
    favorites: Number(r?.favorites ?? 0),
    publics: Number(r?.publics ?? 0),
    privates: Number(r?.privates ?? 0),
  };
}

// ===== Artifacts =====

export async function listArtifacts(userId: string, q?: string) {
  const db = getDb();
  const conds = [eq(artifacts.userId, userId)];
  if (q) {
    const term = `%${q}%`;
    conds.push(or(like(artifacts.title, term), like(artifacts.code, term))!);
  }
  return db.select().from(artifacts).where(and(...conds)).orderBy(desc(artifacts.updatedAt));
}

export async function getArtifact(id: number, userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.id, id), eq(artifacts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createArtifact(
  userId: string,
  data: {
    title: string;
    description?: string;
    type?: string;
    language?: string;
    code: string;
    promptId?: number;
  }
) {
  const db = getDb();
  const res = await db.insert(artifacts).values({
    userId,
    title: data.title,
    description: data.description ?? null,
    type: data.type ?? "html",
    language: data.language ?? null,
    code: data.code,
    promptId: data.promptId ?? null,
  });
  return getArtifact(Number(res[0].insertId), userId);
}

export async function updateArtifact(
  id: number,
  userId: string,
  data: Partial<{ title: string; description: string; type: string; language: string; code: string; isFavorite: boolean; promptId: number | null }>
) {
  const existing = await getArtifact(id, userId);
  if (!existing) return null;
  const db = getDb();
  await db.update(artifacts).set(data).where(eq(artifacts.id, id));
  return getArtifact(id, userId);
}

export async function deleteArtifact(id: number, userId: string) {
  const db = getDb();
  const existing = await getArtifact(id, userId);
  if (!existing) return false;
  await db.delete(artifacts).where(eq(artifacts.id, id));
  return true;
}

// ===== Biblioteca =====

export async function listLibraryItems(sector?: string) {
  const db = getDb();
  if (sector) {
    return db
      .select()
      .from(libraryItems)
      .where(eq(libraryItems.sector, sector))
      .orderBy(desc(libraryItems.featured), desc(libraryItems.createdAt));
  }
  return db.select().from(libraryItems).orderBy(desc(libraryItems.featured), desc(libraryItems.createdAt));
}

export async function createLibraryItem(data: {
  sector: string;
  title: string;
  content: string;
  tags?: string;
  featured?: boolean;
}) {
  const db = getDb();
  await db.insert(libraryItems).values({
    sector: data.sector,
    title: data.title,
    content: data.content,
    tags: data.tags ?? null,
    featured: data.featured ?? false,
  });
}
