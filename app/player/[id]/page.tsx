"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import LikeDislike from "@/components/LikeDislike";
import QuestionnairePrompt from "@/components/QuestionnairePrompt";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [interaction, setInteraction] = useState<"like" | "dislike" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allVideoIds, setAllVideoIds] = useState<string[]>([]);

  useEffect(() => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) {
      router.replace("/registro");
      return;
    }
    setUserId(profileId);

    async function fetchData() {
      const [videoRes, interactionRes, allVideosRes] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase
          .from("interactions")
          .select("type")
          .eq("user_id", profileId)
          .eq("video_id", videoId)
          .maybeSingle(),
        supabase.from("videos").select("id").order("created_at"),
      ]);

      if (videoRes.data) setVideo(videoRes.data);
      if (interactionRes.data) setInteraction(interactionRes.data.type);
      if (allVideosRes.data) setAllVideoIds(allVideosRes.data.map((v) => v.id));
      setLoading(false);
    }

    fetchData();
  }, [videoId, router]);

  const currentIndex = allVideoIds.indexOf(videoId);
  const prevVideoId = currentIndex > 0 ? allVideoIds[currentIndex - 1] : null;
  const nextVideoId = currentIndex < allVideoIds.length - 1 ? allVideoIds[currentIndex + 1] : null;

  const goToPrev = useCallback(() => {
    if (prevVideoId) router.push(`/player/${prevVideoId}`);
  }, [prevVideoId, router]);

  const goToNext = useCallback(() => {
    if (nextVideoId) router.push(`/player/${nextVideoId}`);
  }, [nextVideoId, router]);

  // Keyboard navigation: ArrowUp = previous, ArrowDown = next
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <p className="text-error">Vídeo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <QuestionnairePrompt />
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        <main className="flex-1">
          <div className="relative">
            <div className="aspect-video w-full mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${video.video_url}?autoplay=1&mute=1`}
                title={video.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* Navigation arrows */}
            <div className="absolute right-[-3rem] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
              <button
                className="btn btn-circle btn-sm btn-neutral"
                onClick={goToPrev}
                disabled={!prevVideoId}
                title="Vídeo anterior (↑)"
              >
                ▲
              </button>
              <button
                className="btn btn-circle btn-sm btn-neutral"
                onClick={goToNext}
                disabled={!nextVideoId}
                title="Próximo vídeo (↓)"
              >
                ▼
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-base-content/70 mb-4">{video.description}</p>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {userId && (
              <LikeDislike
                videoId={videoId}
                userId={userId}
                interaction={interaction}
                onInteractionChange={(newType) => setInteraction(newType)}
              />
            )}
            <div className="flex items-center gap-2">
              {/* Mobile navigation arrows */}
              <button
                className="btn btn-sm btn-neutral lg:hidden"
                onClick={goToPrev}
                disabled={!prevVideoId}
              >
                ▲ Anterior
              </button>
              <button
                className="btn btn-sm btn-neutral lg:hidden"
                onClick={goToNext}
                disabled={!nextVideoId}
              >
                Próximo ▼
              </button>
              <Link href="/catalogo" className="btn btn-ghost">
                ← Voltar ao catálogo
              </Link>
            </div>
          </div>
        </main>
        <aside className="w-full lg:w-80 shrink-0">
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
