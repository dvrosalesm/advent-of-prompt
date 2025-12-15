"use client";
import { useLanguage } from "@/components/language-provider";

export function EmptyStateClient() {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center gap-4 py-12">
            <div className="text-6xl">✨</div>
            <p className="text-cursor-text-muted text-lg">{t.noSubmissions}</p>
        </div>
    );
}
