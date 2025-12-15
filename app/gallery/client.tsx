"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SubmissionCard from "./submission-card";
import GalleryHeader from "./gallery-header";
import { EmptyStateClient } from "./empty-state";
import { useLanguage } from "@/components/language-provider";
import { Snowfall } from "@/components/ui/snowfall";

type Submission = {
  id: number;
  userPrompt: string;
  aiResponse: string | null;
  outputType: string;
  score: number;
  createdAt: string;
  user: { name: string | null };
  challenge: { day: number; title: string; titleEs: string; description: string; descriptionEs: string; outputType: string; targetImage: string | null };
  votes: { userId: number }[];
  comments: { id: number; content: string; user: { name: string | null } }[];
};

type GalleryResponse = {
  submissions: Submission[];
  nextCursor: string | null;
  currentUserId: number | null;
};

export default function GalleryClient() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchSubmissions = useCallback(async (cursor?: string) => {
    try {
      const url = cursor ? `/api/gallery?cursor=${cursor}` : "/api/gallery";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data: GalleryResponse = await response.json();

      if (cursor) {
        setSubmissions((prev) => [...prev, ...data.submissions]);
      } else {
        setSubmissions(data.submissions);
        setCurrentUserId(data.currentUserId);
      }

      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      await fetchSubmissions();
      setIsLoading(false);
    };
    loadInitial();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (isLoading || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isLoadingMore) {
          setIsLoadingMore(true);
          fetchSubmissions(nextCursor).finally(() => {
            setIsLoadingMore(false);
          });
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isLoading, nextCursor, isLoadingMore, fetchSubmissions]);

  if (error) {
    return (
      <div className="min-h-screen bg-cursor-bg flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-cursor-error mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cursor-accent text-white rounded-lg hover:bg-cursor-accent-hover transition-colors"
          >
            {t.tryAgain || "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cursor-bg relative">
      <Snowfall />

      {/* Header */}
      <header className="h-16 border-b border-cursor-border flex items-center justify-center px-6 bg-cursor-bg-secondary/80 backdrop-blur-md sticky top-0 z-10">
        <GalleryHeader />
      </header>

      {/* Main content */}
      <main className="w-full px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-cursor-bg-secondary rounded-xl border border-cursor-border overflow-hidden"
              >
                <div className="p-3 border-b border-cursor-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-cursor-bg-tertiary rounded animate-shimmer" />
                    <div className="space-y-1">
                      <div className="w-16 h-4 bg-cursor-bg-tertiary rounded animate-shimmer" />
                      <div className="w-24 h-3 bg-cursor-bg-tertiary rounded animate-shimmer" />
                    </div>
                  </div>
                </div>
                <div className="aspect-[4/3] bg-cursor-bg-tertiary animate-shimmer" />
                <div className="p-3 border-t border-cursor-border">
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-cursor-bg-tertiary rounded-full animate-shimmer" />
                    <div className="w-16 h-6 bg-cursor-bg-tertiary rounded-full animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-cursor-text-muted">
            <EmptyStateClient />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  currentUserId={currentUserId}
                />
              ))}
            </div>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-6">
              {isLoadingMore && (
                <div className="flex items-center gap-3 text-cursor-text-muted">
                  <div className="w-5 h-5 border-2 border-cursor-border border-t-cursor-accent rounded-full animate-spin" />
                  <span>{t.loading || "Loading more..."}</span>
                </div>
              )}
              {!nextCursor && submissions.length > 0 && (
                <p className="text-cursor-text-muted/60 text-sm">
                  ✨ {t.endOfGallery || "You've reached the end of the gallery"} ✨
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
