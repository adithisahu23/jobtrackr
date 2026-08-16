import { ApplicationStatus, STATUS_LABELS, STATUS_COLORS } from "../types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${STATUS_COLORS[status]}1A`, color: STATUS_COLORS[status] }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  );
}
