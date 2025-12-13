"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { LanguageToggle } from "@/components/ui/language-toggle";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-christmas-green relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-christmas-red/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-christmas-green/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-christmas-cream/20 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md relative">
        {/* Decorative top bar */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-christmas-red to-transparent rounded-full" />

        {/* Main card */}
        <div className="relative bg-white/60 backdrop-blur-xl p-10 rounded-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-christmas-cream/30 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-christmas-red to-christmas-red/80 shadow-lg shadow-christmas-red/25 mb-2">
                <span className="text-3xl">🎄</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-christmas-green via-christmas-green to-christmas-brown bg-clip-text text-transparent">
                {t.login.title}
              </h1>
              <p className="text-christmas-green/60 text-sm">{t.login.subtitle}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="group relative">
                  <label
                    htmlFor="name"
                    className="absolute -top-2.5 left-3 px-2 bg-white/80 text-xs font-medium text-christmas-green/70 transition-all"
                  >
                    {t.login.nameLabel}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    disabled={isLoading}
                    className="block w-full rounded-xl border-2 border-christmas-green/10 bg-white/50 py-3.5 px-4 text-christmas-green placeholder:text-christmas-green/30 focus:border-christmas-red/50 focus:bg-white/80 focus:ring-4 focus:ring-christmas-red/10 text-sm transition-all duration-200 outline-none disabled:opacity-50"
                    placeholder={t.login.namePlaceholder}
                  />
                </div>
                <div className="group relative">
                  <label
                    htmlFor="email"
                    className="absolute -top-2.5 left-3 px-2 bg-white/80 text-xs font-medium text-christmas-green/70 transition-all"
                  >
                    {t.login.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    className="block w-full rounded-xl border-2 border-christmas-green/10 bg-white/50 py-3.5 px-4 text-christmas-green placeholder:text-christmas-green/30 focus:border-christmas-red/50 focus:bg-white/80 focus:ring-4 focus:ring-christmas-red/10 text-sm transition-all duration-200 outline-none disabled:opacity-50"
                    placeholder={t.login.emailPlaceholder}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-christmas-red to-christmas-red/90 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-christmas-red/25 transition-all duration-300 hover:shadow-xl hover:shadow-christmas-red/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? "Loading..." : t.login.cta}
                  {!isLoading && (
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </form>

            {/* Decorative footer dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-christmas-red/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-christmas-green/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-christmas-red/40" />
            </div>
          </div>
        </div>

        {/* Decorative bottom reflection */}
        <div className="absolute -bottom-4 left-4 right-4 h-8 bg-gradient-to-b from-christmas-green/5 to-transparent rounded-3xl blur-sm" />
      </div>
    </div>
  );
}
