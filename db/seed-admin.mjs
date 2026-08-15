// Cria (ou atualiza) o usuário admin jhonata@comeca.ai com senha de ADMIN_PASSWORD.
// Uso:
//   DATABASE_URL=mysql://... ADMIN_PASSWORD='senha-forte' node db/seed-admin.mjs
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import "dotenv/config";

const ADMIN_EMAIL = "jhonata@comeca.ai";
const ADMIN_NAME = "Jhonata";

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!databaseUrl) {
  console.error("ERRO: defina DATABASE_URL.");
  process.exit(1);
}
if (!adminPassword) {
  console.error("ERRO: defina ADMIN_PASSWORD (senha do admin).");
  process.exit(1);
}
if (adminPassword.length < 8) {
  console.error("ERRO: ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(adminPassword, 10);
const conn = await mysql.createConnection(databaseUrl);

try {
  const [rows] = await conn.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL],
  );

  if (rows.length > 0) {
    await conn.execute(
      "UPDATE users SET name = ?, passwordHash = ?, role = 'admin', lastSignInAt = NOW() WHERE email = ?",
      [ADMIN_NAME, passwordHash, ADMIN_EMAIL],
    );
    console.log(`Admin atualizado: ${ADMIN_EMAIL}`);
  } else {
    await conn.execute(
      "INSERT INTO users (name, email, passwordHash, role, createdAt, updatedAt, lastSignInAt) VALUES (?, ?, ?, 'admin', NOW(), NOW(), NOW())",
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash],
    );
    console.log(`Admin criado: ${ADMIN_EMAIL}`);
  }
} finally {
  await conn.end();
}
