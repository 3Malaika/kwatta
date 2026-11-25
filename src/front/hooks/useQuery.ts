"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

/** Cache client simple : on affiche l'ancien résultat tout de suite, puis on rafraîchit. */
const cache = new Map<string, unknown>();
export const clearCache = () => cache.clear();

export function useQuery<T>(key: string | null, opts: { refreshMs?: number } = {}) {
  const [data, setData] = useState<T | undefined>(() => (key ? (cache.get(key) as T | undefined) : undefined));
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(() => !!key && !cache.has(key));

  const refresh = useCallback(async () => {
    if (!key) return;
    try {
      const d = await api<T>(key);
      cache.set(key, d);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setData(key ? (cache.get(key) as T | undefined) : undefined);
    setLoading(!!key && !cache.has(key));
    void refresh();
    if (!opts.refreshMs) return;
    const timer = setInterval(() => void refresh(), opts.refreshMs);
    return () => clearInterval(timer);
  }, [key, refresh, opts.refreshMs]);

  return { data, error, loading, refresh };
}
