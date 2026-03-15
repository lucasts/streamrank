"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import VideoCard from "@/components/VideoCard";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
}

interface Interaction {
  video_id: string;
  type: "like" | "dislike";
}

export default function CatalogoPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) {
      router.replace("/registro");
      return;
    }

    async function fetchData() {
      const [videosRes, interactionsRes] = await Promise.all([
        supabase.from("videos").select("*").order("created_at"),
        supabase
          .from("interactions")
          .select("video_id, type")
          .eq("user_id", profileId),
      ]);

      if (videosRes.data) setVideos(videosRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      setLoading(false);
    }

    fetchData();
  }, [router]);

  function getUserInteraction(videoId: string): "like" | "dislike" | null {
    const found = interactions.find((i) => i.video_id === videoId);
    return found ? found.type : null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                userInteraction={getUserInteraction(video.id)}
              />
            ))}
          </div>
        </main>
        <aside className="w-full lg:w-80 shrink-0">
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
