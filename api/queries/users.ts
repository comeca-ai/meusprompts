import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
}) {
  await getDb().insert(schema.users).values({
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role ?? "user",
    lastSignInAt: new Date(),
  });
  return findUserByEmail(data.email);
}

export async function touchLastSignIn(id: number) {
  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, id));
}

/**
 * Chave estável do dono usada nas tabelas do vault/leads (userId varchar).
 * Contas novas (e-mail): `u<id>`; contas legadas Kimi: unionId.
 */
export function userOwnerKey(user: schema.User): string {
  return user.unionId ?? `u${user.id}`;
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
