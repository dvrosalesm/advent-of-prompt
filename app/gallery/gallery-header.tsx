"use client";
import { useLanguage } from "@/components/language-provider";

export default function GalleryHeader() {
    const { t } = useLanguage();
    return <h1 className="ml-4 text-xl font-bold text-christmas-green w-full text-center">{t.communityGallery}</h1>;
}
