"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "es" : "en")}
      className="px-3 py-1 rounded-full border border-christmas-green text-sm font-medium text-christmas-green hover:text-christmas-red hover:border-christmas-red transition-colors"
    >
      {language === "en" ? "ES" : "EN"}
    </button>
  );
}

