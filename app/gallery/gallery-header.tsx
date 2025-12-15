"use client";
import { useLanguage } from "@/components/language-provider";

export default function GalleryHeader() {
    const { t } = useLanguage();
    return (
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-cursor-text">{t.communityGallery}</h1>
        </div>
    );
}
