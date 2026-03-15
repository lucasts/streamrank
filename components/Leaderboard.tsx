"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_interactions: number;
  position: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .limit(10);
    if (data) setEntries(data);
  }

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("streamrank_profile_id"));
    fetchLeaderboard();

    const channel = supabase
      .channel("interactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interactions" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-lg font-bold text-primary mb-3">Placar</h2>
      {entries.length === 0 ? (
        <p className="text-base-content/50 text-sm">Nenhuma interação ainda.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.id === currentUserId;
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  isCurrentUser
                    ? "border-2 border-accent bg-base-300"
                    : "bg-base-100"
                }`}
              >
                <span
                  className={`text-sm font-bold w-6 text-center ${
                    entry.position === 1 ? "text-accent" : "text-base-content/50"
                  }`}
                >
                  {entry.position}º
                </span>
                <div className="avatar placeholder">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      entry.position === 1 ? "bg-accent text-accent-content" : "bg-neutral text-neutral-content"
                    }`}
                  >
                    <span className="text-xs">{getInitials(entry.display_name)}</span>
                  </div>
                </div>
                <span className="flex-1 text-sm truncate">{entry.display_name}</span>
                <span className="text-sm text-base-content/50">
                  {entry.total_interactions}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
