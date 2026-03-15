"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const QUESTIONNAIRE_URL = "#"; // placeholder — substituir pela URL real do questionário

export default function Header() {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const profileId = localStorage.getItem("streamrank_profile_id");
      if (!profileId) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", profileId)
        .single();

      if (data) setDisplayName(data.display_name);
    }
    fetchProfile();
  }, []);

  return (
    <header className="navbar bg-base-200 border-b border-neutral px-4">
      <div className="flex-1">
        <span className="text-xl font-bold text-primary">StreamRank</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={QUESTIONNAIRE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-primary btn-sm"
        >
          Responder questionário
        </a>
        {displayName && (
          <span className="text-base-content/70 text-sm">
            Olá, <span className="text-primary font-medium">{displayName}</span>
          </span>
        )}
      </div>
    </header>
  );
}
