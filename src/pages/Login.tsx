import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";

type Tab = "entrar" | "criar";

const inputClass =
  "w-full rounded-xl border border-[#dbe3f2] bg-white px-4 py-2.5 text-sm text-[#0b1020] placeholder-[#9aa6c0] transition focus:border-[#3e7aef] focus:outline-none focus:ring-2 focus:ring-[#3e7aef]/25";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<Tab>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/app");
    },
    onError: (err) => setError(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/app");
    },
    onError: (err) => setError(err.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === "entrar") {
      loginMutation.mutate({ email, password });
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    registerMutation.mutate({ name, email, password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fc] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-[#e3e9f6] bg-white shadow-[0_24px_60px_-24px_rgb(62_122_239/0.35)]">
          {/* Header escuro com marca */}
          <div className="bg-[#0b1020] px-8 py-7 text-center">
            <a href="/" className="inline-block font-display text-2xl font-bold text-white">
              c<span className="text-[#8fb2ff]">∞</span>meca.ai
            </a>
            <span className="mt-2 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8fb2ff]">
              meusprompts
            </span>
          </div>

          <div className="px-8 py-8">
            {/* Abas */}
            <div className="grid grid-cols-2 rounded-xl bg-[#eef2fb] p-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "entrar"}
                onClick={() => switchTab("entrar")}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition",
                  tab === "entrar"
                    ? "bg-white text-[#0b1020] shadow-sm"
                    : "text-[#5a6a8a] hover:text-[#0b1020]",
                )}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "criar"}
                onClick={() => switchTab("criar")}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition",
                  tab === "criar"
                    ? "bg-white text-[#0b1020] shadow-sm"
                    : "text-[#5a6a8a] hover:text-[#0b1020]",
                )}
              >
                Criar conta
              </button>
            </div>

            <p className="mt-5 text-center text-sm leading-relaxed text-[#5a6a8a]">
              {tab === "entrar"
                ? "Acesse sua biblioteca de prompts, artefatos e os prompts prontos por setor."
                : "Crie sua conta grátis e comece a organizar seus prompts em menos de 1 minuto."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {tab === "criar" && (
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-[#0b1020]">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#0b1020]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#0b1020]">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={tab === "entrar" ? "current-password" : "new-password"}
                  required
                  minLength={tab === "criar" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "criar" ? "Mínimo de 8 caracteres" : "Sua senha"}
                  className={inputClass}
                />
              </div>

              {tab === "criar" && (
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-[#0b1020]">
                    Confirmar senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className={inputClass}
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-lg border border-[#f3c2c2] bg-[#fdf2f2] px-3.5 py-2.5 text-sm text-[#c0392b]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 w-full rounded-xl bg-[#3e7aef] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f66d6] focus:outline-none focus:ring-2 focus:ring-[#3e7aef] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? "Aguarde…"
                  : tab === "entrar"
                    ? "Entrar"
                    : "Criar minha conta"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-[#8a97b5]">
              Grátis · Seus prompts ficam salvos na sua conta
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="mt-6 text-center text-xs text-[#8a97b5]">
          <a href="/" className="underline-offset-2 hover:underline">
            ← Voltar para a página inicial
          </a>
        </p>
      </div>
    </div>
  );
}
