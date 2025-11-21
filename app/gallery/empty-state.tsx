"use client";
import { useLanguage } from "@/components/language-provider";

export function EmptyStateClient() {
    const { t } = useLanguage();
    return <>{t.noSubmissions}</>;
}

