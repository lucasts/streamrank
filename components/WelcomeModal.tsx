"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "streamrank_welcome_seen";

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box bg-base-200 border border-primary/30 max-w-lg">
        <h3 className="font-bold text-xl text-primary mb-4">
          Bem-vindo ao StreamRank!
        </h3>
        <p className="text-base-content/80 mb-3">
          Você está participando de uma pesquisa acadêmica sobre gamificação em
          plataformas de streaming. Veja como funciona:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-base-content/80 mb-4">
          <li>
            <span className="font-medium text-base-content">Navegue pelo catálogo</span>{" "}
            e assista aos vídeos
          </li>
          <li>
            <span className="font-medium text-base-content">Avalie com Gostei ou Não gostei</span>{" "}
            — pelo menos <span className="text-primary font-bold">5 interações</span>
          </li>
          <li>
            Acompanhe sua posição no{" "}
            <span className="font-medium text-accent">Placar</span> em tempo real
          </li>
          <li>
            Ao final,{" "}
            <span className="font-medium text-base-content">responda ao questionário</span>{" "}
            de avaliação
          </li>
        </ol>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={handleClose}>
            Entendi, vamos lá!
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={handleClose} />
    </dialog>
  );
}
