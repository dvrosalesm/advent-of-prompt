"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

export function BackButton() {
  const { t } = useLanguage();
  return (
    <Link href="/" className="absolute text-christmas-green/70 hover:text-christmas-green flex items-center gap-2 transition-colors font-medium">
      ← {t.backToCalendar}
    </Link>
  );
}
