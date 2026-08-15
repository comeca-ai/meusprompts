import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { User } from "@db/schema";

vi.hoisted(() => {
  process.env.APP_SECRET = "test-secret-key-123456";
});

// Mock da camada de queries (sem MySQL no ambiente de teste)
const usersStore = new Map<string, User>();
let nextId = 1;

vi.mock("./queries/users", () => ({
  findUserByEmail: async (email: string) => usersStore.get(email),
  findUserById: async (id: number) =>
    [...usersStore.values()].find((u) => u.id === id),
  createUser: async (data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: "user" | "admin";
  }) => {
    const user = {
      id: nextId++,
      unionId: null,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      avatar: null,
      role: data.role ?? "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    } as User;
    usersStore.set(user.email!, user);
    return user;
  },
  touchLastSignIn: async () => {},
  userOwnerKey: (user: User) => user.unionId ?? `u${user.id}`,
}));

import { authRouter } from "./auth-router";
import { verifySessionToken } from "./kimi/session";

let ipSeq = 0;

function makeCtx(headers?: Record<string, string>) {
  // IP único por chamada → isola o rate limiter entre testes
  const ip = `10.9.${(ipSeq = (ipSeq + 1) % 250)}.${Math.floor(Math.random() * 250)}`;
  return {
    req: new Request("http://localhost/api/trpc/auth.login", {
      headers: { "x-forwarded-for": ip, ...headers },
    }),
    resHeaders: new Headers(),
  };
}

function makeCtxWithIp(ip: string) {
  return {
    req: new Request("http://localhost/api/trpc/auth.login", {
      headers: { "x-forwarded-for": ip },
    }),
    resHeaders: new Headers(),
  };
}

function sessionCookie(ctx: ReturnType<typeof makeCtx>): string {
  const setCookie = ctx.resHeaders.get("set-cookie");
  expect(setCookie).toBeTruthy();
  const match = /session=([^;]+)/.exec(setCookie!);
  expect(match).toBeTruthy();
  return match![1];
}

describe("auth e-mail + senha", () => {
  const caller = authRouter.createCaller as (
    ctx: unknown,
  ) => ReturnType<typeof authRouter.createCaller>;
  const password = "senha-super-segura";

  beforeEach(() => {
    usersStore.clear();
    nextId = 1;
  });

  it("register cria usuário, normaliza e-mail e seta cookie de sessão", async () => {
    const ctx = makeCtx();
    const user = await caller(ctx).register({
      name: "Jhonata",
      email: "  JHONATA@Comeca.ai ",
      password,
    });

    expect(user.email).toBe("jhonata@comeca.ai");
    expect(user.name).toBe("Jhonata");

    const token = sessionCookie(ctx);
    const payload = await verifySessionToken(token);
    expect(payload?.userId).toBe(user.id);

    // hash bcrypt persistido, senha em texto nunca
    const stored = usersStore.get("jhonata@comeca.ai")!;
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(password);
  });

  it("register rejeita e-mail duplicado com mensagem PT-BR", async () => {
    usersStore.set("jhonata@comeca.ai", {
      id: 99,
      email: "jhonata@comeca.ai",
      passwordHash: await bcrypt.hash(password, 4),
    } as User);

    await expect(
      caller(makeCtx()).register({
        name: "Outro",
        email: "jhonata@comeca.ai",
        password,
      }),
    ).rejects.toThrow(/E-mail já cadastrado/);
  });

  it("register rejeita senha curta", async () => {
    await expect(
      caller(makeCtx()).register({
        name: "J",
        email: "j@comeca.ai",
        password: "curta",
      }),
    ).rejects.toThrow(/pelo menos 8 caracteres/);
  });

  it("login com senha correta seta cookie; errada falha com mensagem PT-BR", async () => {
    const ctx = makeCtx();
    const user = await caller(ctx).register({
      name: "Jhonata",
      email: "jhonata@comeca.ai",
      password,
    });

    await expect(
      caller(makeCtx()).login({
        email: "jhonata@comeca.ai",
        password: "errada123",
      }),
    ).rejects.toThrow(/E-mail ou senha incorretos/);

    const loginCtx = makeCtx();
    const logged = await caller(loginCtx).login({
      email: "JHONATA@comeca.ai",
      password,
    });
    expect(logged.id).toBe(user.id);
    const payload = await verifySessionToken(sessionCookie(loginCtx));
    expect(payload?.userId).toBe(user.id);
  });

  it("login inexistente falha com a mesma mensagem genérica", async () => {
    await expect(
      caller(makeCtx()).login({
        email: "ninguem@comeca.ai",
        password: "qualquer1",
      }),
    ).rejects.toThrow(/E-mail ou senha incorretos/);
  });

  it("rate limit bloqueia após 10 tentativas por IP", async () => {
    usersStore.set("a@b.co", {
      id: 7,
      email: "a@b.co",
      passwordHash: await bcrypt.hash(password, 4),
    } as User);

    const ip = "172.16.0.77";
    for (let i = 0; i < 10; i++) {
      await expect(
        caller(makeCtxWithIp(ip)).login({ email: "a@b.co", password: "errada123" }),
      ).rejects.toThrow(/E-mail ou senha incorretos/);
    }
    await expect(
      caller(makeCtxWithIp(ip)).login({ email: "a@b.co", password }),
    ).rejects.toThrow(/Muitas tentativas/);
  });

  it("logout limpa o cookie de sessão", async () => {
    const ctx = makeCtx();
    const user = { id: 1, email: "x@y.z", role: "user" } as User;
    const res = await caller({ ...ctx, user }).logout();
    expect(res.success).toBe(true);
    expect(ctx.resHeaders.get("set-cookie")).toMatch(/session=;/);
    expect(ctx.resHeaders.get("set-cookie")).toMatch(/Max-Age=0/);
  });
});
