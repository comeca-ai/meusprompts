import { desc, sql } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function insertLeadEvent(data: schema.InsertLeadEvent) {
  await getDb().insert(schema.leadEvents).values(data);
}

export async function upsertLeadProfile(userId: string, sectorInterest: string) {
  await getDb()
    .insert(schema.leadProfiles)
    .values({ userId, sectorInterest })
    .onDuplicateKeyUpdate({ set: { sectorInterest, updatedAt: new Date() } });
}

export async function getLeadStats() {
  const db = getDb();

  const [totals] = await db
    .select({
      uses: sql<number>`SUM(CASE WHEN type = 'use' THEN 1 ELSE 0 END)`,
      gateLogins: sql<number>`SUM(CASE WHEN type = 'gate_login' THEN 1 ELSE 0 END)`,
      ctaClicks: sql<number>`SUM(CASE WHEN type = 'cta_whatsapp' THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(schema.leadEvents);

  const bySector = await db
    .select({ sector: schema.leadEvents.sector, count: sql<number>`COUNT(*)` })
    .from(schema.leadEvents)
    .where(sql`type = 'use' AND sector IS NOT NULL`)
    .groupBy(schema.leadEvents.sector)
    .orderBy(sql`COUNT(*) DESC`);

  const recentEvents = await db
    .select()
    .from(schema.leadEvents)
    .orderBy(desc(schema.leadEvents.createdAt))
    .limit(50);

  const leads = await db
    .select({
      unionId: schema.users.unionId,
      name: schema.users.name,
      email: schema.users.email,
      lastSignInAt: schema.users.lastSignInAt,
      sectorInterest: schema.leadProfiles.sectorInterest,
    })
    .from(schema.users)
    .leftJoin(
      schema.leadProfiles,
      sql`${schema.leadProfiles.userId} = COALESCE(${schema.users.unionId}, CONCAT('u', ${schema.users.id}))`,
    )
    .orderBy(desc(schema.users.lastSignInAt))
    .limit(100);

  return { totals, bySector, recentEvents, leads };
}
