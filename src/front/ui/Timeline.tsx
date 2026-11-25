import { STATUS_LABELS } from "@/domain/labels";
import type { ReportEvent } from "@/domain/types";

export function Timeline({ events }: { events: ReportEvent[] }) {
  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id}>
          <strong>{STATUS_LABELS[e.toStatus]}</strong>
          <span className="muted small">{new Date(e.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </li>
      ))}
    </ol>
  );
}
