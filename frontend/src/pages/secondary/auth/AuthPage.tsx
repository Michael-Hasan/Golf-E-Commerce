import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { callAuthMutation } from "../../../lib/catalog-api";
import type { Mode } from "../../../types/app";
import { persistToken, readStoredToken } from "../../../lib/app-utils";

export function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readStoredToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await callAuthMutation(
      mode,
      email,
      password,
      phone || undefined,
    );
    setLoading(false);

    if (result.error || !result.token) {
      setError(result.error ?? "Failed to authenticate");
      return;
    }

    persistToken(result.token);
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#d8e3da]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-12">
        <section className="flex flex-col justify-center rounded-[2rem] bg-[#0f3326] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#dbe9df]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
              G
            </span>
            GreenLinks Golf
          </Link>

          <div className="mt-10 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b7ccbe]">
              Golf account
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Simple access for shopping, orders, and saved gear.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#d7e4dc]/88">
              Sign in to check your recent orders and saved details, or create
              an account to make your next golf purchase faster.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-sm font-semibold">Order tracking</p>
              <p className="mt-2 text-sm text-white/68">
                Keep up with current and past purchases.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-sm font-semibold">Quick checkout</p>
              <p className="mt-2 text-sm text-white/68">
                Save your contact details for later.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-sm font-semibold">Saved favorites</p>
              <p className="mt-2 text-sm text-white/68">
                Return to the gear you were considering.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-[#b9c8bd] bg-[#e7efe8] px-5 py-6 shadow-[0_18px_50px_rgba(20,34,28,0.16)] sm:px-7 sm:py-8">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#244636]">
                    Account
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-[#183126]">
                    {mode === "signup" ? "Create account" : "Log in"}
                  </h2>
                </div>
                <Link
                  to="/"
                  className="text-sm font-medium text-[#244636] hover:text-[#0f3326]"
                >
                  Back
                </Link>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#4e6458]">
                {mode === "signup"
                  ? t("auth.signupIntro")
                  : t("auth.loginIntro")}
              </p>

              <div className="mt-6 inline-flex rounded-full bg-[#d6e1d8] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-[#0f3326] text-white"
                      : "text-[#4e6458] hover:text-[#183126]"
                  }`}
                >
                  {t("auth.login")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-[#0f3326] text-white"
                      : "text-[#4e6458] hover:text-[#183126]"
                  }`}
                >
                  {t("auth.signup")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#183126]">
                      {t("auth.phone")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-[#b7c7bc] bg-[#f2f6f3] px-4 py-3 text-sm text-[#183126] placeholder:text-[#7f9186] focus:border-[#0f3326] focus:outline-none focus:ring-4 focus:ring-[#0f3326]/12"
                      placeholder={t("auth.phonePh")}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#183126]">
                    {t("auth.email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-[#b7c7bc] bg-[#f2f6f3] px-4 py-3 text-sm text-[#183126] placeholder:text-[#7f9186] focus:border-[#0f3326] focus:outline-none focus:ring-4 focus:ring-[#0f3326]/12"
                    placeholder={t("auth.emailPh")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#183126]">
                    {t("auth.password")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#b7c7bc] bg-[#f2f6f3] px-4 py-3 text-sm text-[#183126] placeholder:text-[#7f9186] focus:border-[#0f3326] focus:outline-none focus:ring-4 focus:ring-[#0f3326]/12"
                    placeholder={t("auth.passwordPh")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#0f3326] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0a241a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? mode === "signup"
                      ? t("auth.loadingSignup")
                      : t("auth.loadingLogin")
                    : mode === "signup"
                      ? t("auth.submitSignup")
                      : t("auth.submitLogin")}
                </button>
              </form>

              {error && (
                <p className="mt-4 rounded-xl border border-[#efc5bb] bg-[#fff3f0] px-4 py-3 text-sm text-[#9c4332]">
                  {error}
                </p>
              )}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#dbe5de] px-3 py-3 text-sm text-[#476055]">
                  Orders
                </div>
                <div className="rounded-xl bg-[#dbe5de] px-3 py-3 text-sm text-[#476055]">
                  Checkout
                </div>
                <div className="rounded-xl bg-[#dbe5de] px-3 py-3 text-sm text-[#476055]">
                  Favorites
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
