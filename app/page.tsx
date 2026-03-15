"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      const profileId = localStorage.getItem("streamrank_profile_id");
      if (!profileId) {
        router.replace("/registro");
        return;
      }

      // Validate profile still exists in database (handles DB reset)
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle();

      if (data) {
        router.replace("/catalogo");
      } else {
        localStorage.removeItem("streamrank_profile_id");
        router.replace("/registro");
      }
    }
    checkProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
