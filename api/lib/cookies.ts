import type { CookieOptions } from "hono/utils/cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);
  // Override p/ ambientes de teste sem TLS (ex.: COOKIE_SECURE=false no .env)
  const secure =
    process.env.COOKIE_SECURE != null
      ? process.env.COOKIE_SECURE !== "false"
      : !localhost;

  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure,
  };
}
