"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import LikeDislike from "@/components/LikeDislike";

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

  useEffect(() => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) {
      router.replace("/registro");
      return;
    }
    setUserId(profileId);

    async function fetchData() {
      const [videoRes, interactionRes] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase
          .from("interactions")
          .select("type")
          .eq("user_id", profileId)
          .eq("video_id", videoId)
          .maybeSingle(),
      ]);

      if (videoRes.data) setVideo(videoRes.data);
      if (interactionRes.data) setInteraction(interactionRes.data.type);
      setLoading(false);
    }

    fetchData();
  }, [videoId, router]);

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
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        <main className="flex-1">
          <div className="aspect-video w-full mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${video.video_url}`}
              title={video.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-base-content/70 mb-4">{video.description}</p>
          )}
          <div className="flex items-center justify-between">
            {userId && (
              <LikeDislike
                videoId={videoId}
                userId={userId}
                interaction={interaction}
                onInteractionChange={(newType) => setInteraction(newType)}
              />
            )}
            <Link href="/catalogo" className="btn btn-ghost">
              ← Voltar ao catálogo
            </Link>
          </div>
        </main>
        <aside className="w-full lg:w-80 shrink-0">
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
