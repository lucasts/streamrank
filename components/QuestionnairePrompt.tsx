"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const QUESTIONNAIRE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeOj1g55UkOQjGlYKoxHKw8cW7XfzH1LD2Jg1V_qDFJ5LnyjQ/viewform";
const MIN_INTERACTIONS = 5;
const DISMISSED_KEY = "streamrank_questionnaire_dismissed";

export default function QuestionnairePrompt() {
  const [visible, setVisible] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [triggered, setTriggered] = useState(false);

  const checkInteractions = useCallback(async () => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) return 0;

    const { count } = await supabase
      .from("interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId);

    const total = count ?? 0;
    setInteractionCount(total);
    return total;
  }, []);

  // Check interactions on mount and subscribe to changes
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    checkInteractions().then((count) => {
      if (count >= MIN_INTERACTIONS) {
        setVisible(true);
        setTriggered(true);
      }
    });

    // Listen for new interactions to trigger the prompt
    const channel = supabase
      .channel("questionnaire-trigger")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interactions" },
        () => {
          checkInteractions().then((count) => {
            if (count >= MIN_INTERACTIONS && !localStorage.getItem(DISMISSED_KEY)) {
              setVisible(true);
              setTriggered(true);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkInteractions]);

  // Exit-intent: detect mouse leaving viewport (desktop)
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && interactionCount >= MIN_INTERACTIONS && !triggered) {
        setVisible(true);
        setTriggered(true);
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [interactionCount, triggered]);

  // Exit-intent: detect beforeunload (works on mobile and desktop)
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (interactionCount >= MIN_INTERACTIONS) {
        e.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [interactionCount]);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  function handleOpenForm() {
    localStorage.setItem(DISMISSED_KEY, "1");
    window.open(QUESTIONNAIRE_URL, "_blank");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box bg-base-200 border border-accent/30 max-w-lg">
        <h3 className="font-bold text-xl text-accent mb-3">
          Hora de avaliar sua experiência!
        </h3>
        <p className="text-base-content/80 mb-2">
          Você já realizou{" "}
          <span className="text-primary font-bold">{interactionCount}</span>{" "}
          interações — obrigado por participar!
        </p>
        <p className="text-base-content/80 mb-4">
          Agora, ajude nossa pesquisa respondendo um questionário rápido
          (aproximadamente 3 minutos). Suas respostas são anônimas.
        </p>
        <div className="modal-action flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>
            Depois
          </button>
          <button className="btn btn-accent" onClick={handleOpenForm}>
            Responder questionário
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={handleDismiss} />
    </dialog>
  );
}
