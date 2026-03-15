"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Por favor, informe seu nome.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("profiles")
      .insert({ display_name: trimmed })
      .select("id")
      .single();

    if (dbError || !data) {
      setError("Erro ao registrar. Tente novamente.");
      setLoading(false);
      return;
    }

    localStorage.setItem("streamrank_profile_id", data.id);
    router.push("/catalogo");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary text-center mb-2">
          StreamRank
        </h1>
        <p className="text-center text-base-content/70 mb-6">
          Plataforma de streaming com placar
        </p>

        <label className="label mb-1">
          <span className="label-text">Qual é o seu nome?</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-primary w-full mb-4"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
        />

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner" /> : "Entrar"}
        </button>
      </form>
    </div>
  );
}
