const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_service: "In service",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status.replaceAll("_", " ");
  return <span className={`status-badge status-badge-${status}`}>{label}</span>;
}
