import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  // bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
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
