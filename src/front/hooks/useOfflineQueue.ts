"use client";
import { useEffect, useState } from "react";
import { flushQueue, pendingCount } from "../lib/offlineQueue";

/** Rejoue la file au retour du réseau et expose le nombre d'actions en attente. */
export function useOfflineQueue() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const sync = () => setPending(pendingCount());
    const flush = () => void flushQueue();
    sync();
    flush();
    window.addEventListener("online", flush);
    window.addEventListener("kw-queue", sync);
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener("kw-queue", sync);
    };
  }, []);

  return pending;
}
