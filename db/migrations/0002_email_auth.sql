-- =============================================================
-- 0002_email_auth.sql — Autenticação própria (e-mail + senha)
-- Idempotente: pode ser executado mais de uma vez sem erro.
-- Rode manualmente em cada MySQL:
--   mysql -u <user> -p <database> < db/migrations/0002_email_auth.sql
-- =============================================================

-- 1) Coluna passwordHash (se não existir)
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash'
);
SET @ddl := IF(@col = 0,
  'ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) email: normaliza para varchar(255) (idempotente)
ALTER TABLE `users` MODIFY COLUMN `email` varchar(255) NULL;

-- 3) unionId: passa a permitir NULL (contas novas não têm unionId)
ALTER TABLE `users` MODIFY COLUMN `unionId` varchar(255) NULL;

-- 4) Índice único em email (se não existir).
--    MySQL permite múltiplos NULLs em índice único, então usuários
--    legados do Kimi (sem e-mail) não conflitam.
SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_email_unique'
);
SET @ddl := IF(@idx = 0,
  'ALTER TABLE `users` ADD UNIQUE KEY `users_email_unique` (`email`)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
