import { ApiError, post } from "./api";

/**
 * File hors ligne pour les actions JSON idempotentes (ex. « encaissé »).
 * Les photos ne passent pas par ici : elles exigent une connexion.
 */
const KEY = "kw_offline_queue";

interface QueueItem {
  id: string;
  path: string;
  body?: unknown;
}

function read(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
const write = (items: QueueItem[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const pendingCount = () => read().length;

export function enqueue(path: string, body?: unknown): void {
  write([...read(), { id: crypto.randomUUID(), path, body }]);
  window.dispatchEvent(new Event("kw-queue"));
}

/** Rejoue la file dans l'ordre. S'arrête dès que le réseau manque. */
export async function flushQueue(): Promise<void> {
  for (const item of read()) {
    try {
      await post(item.path, item.body);
    } catch (e) {
      if (e instanceof ApiError && e.code === "NETWORK") break;
      // Échec définitif (conflit, droits…) : on retire l'action pour ne pas boucler.
    }
    write(read().filter((i) => i.id !== item.id));
  }
  window.dispatchEvent(new Event("kw-queue"));
}
