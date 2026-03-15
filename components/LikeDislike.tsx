"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LikeDislikeProps {
  videoId: string;
  userId: string;
  interaction: "like" | "dislike" | null;
  onInteractionChange: (newType: "like" | "dislike") => void;
}

export default function LikeDislike({
  videoId,
  userId,
  interaction,
  onInteractionChange,
}: LikeDislikeProps) {
  const [loading, setLoading] = useState(false);

  async function handleInteraction(type: "like" | "dislike") {
    if (loading || interaction === type) return;

    setLoading(true);

    const { error } = await supabase.from("interactions").upsert(
      { user_id: userId, video_id: videoId, type },
      { onConflict: "user_id,video_id" }
    );

    if (!error) {
      onInteractionChange(type);
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-3">
      <button
        className={`btn ${
          interaction === "like" ? "btn-success" : "btn-outline btn-success"
        }`}
        onClick={() => handleInteraction("like")}
        disabled={loading}
      >
        👍 Gostei
      </button>
      <button
        className={`btn ${
          interaction === "dislike" ? "btn-error" : "btn-outline btn-error"
        }`}
        onClick={() => handleInteraction("dislike")}
        disabled={loading}
      >
        👎 Não gostei
      </button>
    </div>
  );
}
