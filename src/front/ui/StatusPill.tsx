import { STATUS_LABELS } from "@/domain/labels";
import type { ReportStatus } from "@/domain/types";

export function StatusPill({ status }: { status: ReportStatus }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABELS[status]}</span>;
}
