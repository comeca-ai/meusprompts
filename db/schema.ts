import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  int,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  // Legado (Kimi OAuth): nullable — contas novas usam e-mail + senha
  unionId: varchar("unionId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()

// ===== App: Melhore Meu Prompt por Setor =====

// Sensor de demanda: cada uso do melhorador / gate / clique no CTA
export const leadEvents = mysqlTable("lead_events", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }), // unionId quando autenticado; null em uso anônimo
  type: varchar("type", { length: 32 }).notNull(), // "use" | "gate_login" | "cta_whatsapp"
  sector: varchar("sector", { length: 64 }), // setor escolhido (quando houver)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadEvent = typeof leadEvents.$inferSelect;
export type InsertLeadEvent = typeof leadEvents.$inferInsert;

// Perfil de lead: setor de interesse do usuário autenticado
export const leadProfiles = mysqlTable("lead_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(), // unionId
  sectorInterest: varchar("sectorInterest", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type LeadProfile = typeof leadProfiles.$inferSelect;
export type InsertLeadProfile = typeof leadProfiles.$inferInsert;

// ===== App: meusprompts (vault + artefatos + biblioteca) =====

export const prompts = mysqlTable("prompts", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(), // unionId do dono
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 64 }).notNull().default("Geral"),
  sector: varchar("sector", { length: 64 }), // nullable — enum dos 6 setores
  isFavorite: boolean("isFavorite").notNull().default(false),
  visibility: varchar("visibility", { length: 16 }).notNull().default("private"), // "public" | "private"
  currentVersion: int("currentVersion").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

export const promptVersions = mysqlTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: bigint("promptId", { mode: "number", unsigned: true }).notNull(),
  version: int("version").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  changeNote: varchar("changeNote", { length: 500 }),
  source: varchar("source", { length: 16 }).notNull().default("manual"), // "manual" | "ai"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PromptVersion = typeof promptVersions.$inferSelect;

export const artifacts = mysqlTable("artifacts", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  type: varchar("type", { length: 16 }).notNull().default("html"), // "html" | "code" | "text"
  language: varchar("language", { length: 32 }),
  code: text("code").notNull(),
  promptId: bigint("promptId", { mode: "number", unsigned: true }), // nullable — prompt de origem
  isFavorite: boolean("isFavorite").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
export type Artifact = typeof artifacts.$inferSelect;

export const libraryItems = mysqlTable("library_items", {
  id: serial("id").primaryKey(),
  sector: varchar("sector", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: varchar("tags", { length: 500 }), // csv
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LibraryItem = typeof libraryItems.$inferSelect;
