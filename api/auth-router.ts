import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import {
  createUser,
  findUserByEmail,
  touchLastSignIn,
} from "./queries/users";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import type { User } from "@db/schema";

// ===== Rate limit em memória: 10 tentativas / 10 min por IP no login =====
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

function checkLoginRateLimit(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= LOGIN_MAX_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
    });
  }
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Limpeza periódica para não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (entry.resetAt <= now) loginAttempts.delete(ip);
  }
}, LOGIN_WINDOW_MS).unref();

function setSessionCookie(resHeaders: Headers, reqHeaders: Headers, user: User, token: string) {
  const opts = getSessionCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: (opts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
  return user;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128);

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(1, "Informe seu nome.").max(255),
        email: emailSchema,
        password: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "E-mail já cadastrado. Faça login para continuar.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar sua conta. Tente novamente.",
        });
      }

      const token = await signSessionToken({ userId: user.id });
      return setSessionCookie(ctx.resHeaders, ctx.req.headers, user, token);
    }),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.req.headers);
      checkLoginRateLimit(ip);

      const user = await findUserByEmail(input.email);
      const ok =
        user?.passwordHash != null &&
        (await bcrypt.compare(input.password, user.passwordHash));

      if (!user || !ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha incorretos.",
        });
      }

      resetLoginAttempts(ip);
      await touchLastSignIn(user.id);
      const token = await signSessionToken({ userId: user.id });
      return setSessionCookie(ctx.resHeaders, ctx.req.headers, user, token);
    }),

  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: (opts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
