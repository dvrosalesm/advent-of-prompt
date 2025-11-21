"use client";

import { useLanguage } from "@/components/language-provider";
import { login } from "@/app/actions/auth";
import { LanguageToggle } from "@/components/ui/language-toggle";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-christmas-green relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md space-y-8 text-center bg-white/80 backdrop-blur-md p-10 rounded-2xl border border-christmas-green/20 shadow-xl">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-christmas-red font-display">
            {t.login.title} 🎄
          </h1>
          <p className="text-christmas-green/70 mt-2">{t.login.subtitle}</p>
        </div>

        <form action={login} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                {t.login.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-md border border-christmas-green/20 bg-white py-3 px-3 text-christmas-green placeholder:text-christmas-green/40 focus:z-10 focus:border-christmas-red focus:ring-1 focus:ring-christmas-red sm:text-sm sm:leading-6 transition-all outline-none"
                placeholder={t.login.namePlaceholder}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                {t.login.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border border-christmas-green/20 bg-white py-3 px-3 text-christmas-green placeholder:text-christmas-green/40 focus:z-10 focus:border-christmas-red focus:ring-1 focus:ring-christmas-red sm:text-sm sm:leading-6 transition-all outline-none"
                placeholder={t.login.emailPlaceholder}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-christmas-red px-3 py-3 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-christmas-red shadow-md transition-all"
            >
              {t.login.cta}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
