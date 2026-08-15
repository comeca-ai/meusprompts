import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  const { runSqlMigrations } = await import("./lib/migrate");

  // Migrações SQL idempotentes (ex.: coluna passwordHash da auth própria)
  try {
    await runSqlMigrations();
  } catch (err) {
    console.error("[migrate] falha ao aplicar migrações:", err);
  }

  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  // HOST=127.0.0.1 nos droplets (atrás do nginx); default 0.0.0.0 p/ preview da plataforma
  const hostname = process.env.HOST || "0.0.0.0";
  serve({ fetch: app.fetch, port, hostname }, () => {
    console.log(`Server running on http://${hostname}:${port}/`);
  });
}
