"use client";
import { useCallback, useEffect, useState } from "react";

/** État de formulaire sauvegardé dans localStorage : une coupure réseau ne fait rien perdre. */
export function useDraft<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue({ ...initial, ...JSON.parse(saved) });
    } catch {
      /* brouillon illisible : on repart de zéro */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (patch: Partial<T>) =>
      setValue((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* stockage plein ou désactivé */
        }
        return next;
      }),
    [key],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, update, clear] as const;
}
