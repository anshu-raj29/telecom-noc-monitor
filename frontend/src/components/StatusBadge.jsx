export default function StatusBadge({ value }) {
  const styles = {
    UP: "border-emerald-200 bg-emerald-50 text-emerald-700",
    DEGRADED: "border-amber-200 bg-amber-50 text-amber-700",
    DOWN: "border-rose-200 bg-rose-50 text-rose-700",
    Critical: "border-rose-200 bg-rose-50 text-rose-700",
    High: "border-rose-200 bg-rose-50 text-rose-700",
    Warning: "border-amber-200 bg-amber-50 text-amber-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    Suspicious: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ACTIVE: "border-rose-200 bg-rose-50 text-rose-700",
    RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Normal: "border-sky-200 bg-sky-50 text-sky-700"
  };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[value] || styles.Normal}`}>{value}</span>;
}
