import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "./env";

/**
 * Roda db/migrations/*.sql (arquivos idempotentes) no boot.
 * Necessário porque a plataforma não tem etapa de `db:migrate`;
 * nos droplets a migração também é aplicada manualmente (rodar 2x é seguro).
 */
export async function runSqlMigrations() {
  const dir = path.resolve(process.cwd(), "db/migrations");
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) return;

  const conn = await mysql.createConnection({
    uri: env.databaseUrl,
    multipleStatements: true,
  });
  try {
    for (const file of files) {
      await conn.query(fs.readFileSync(path.join(dir, file), "utf8"));
      console.log(`[migrate] ${file} aplicada`);
    }
  } finally {
    await conn.end();
  }
}
