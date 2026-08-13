function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
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

          <div className="px-8 py-8 text-center">
            <h1 className="font-display text-xl font-semibold text-[#0b1020]">
              Entre na sua conta
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6a8a]">
              Acesse sua biblioteca de prompts, artefatos e os prompts prontos por setor.
              Se é sua primeira vez, a conta é criada automaticamente — sem
              senha, sem cadastro.
            </p>

            <button
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
              className="mt-6 w-full rounded-xl bg-[#3e7aef] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f66d6] focus:outline-none focus:ring-2 focus:ring-[#3e7aef] focus:ring-offset-2"
            >
              Entrar com a conta Kimi
            </button>

            <p className="mt-4 text-xs text-[#8a97b5]">
              Grátis · Leva menos de 30 segundos
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
