import StatusBadge from "./StatusBadge";

export default function AlertsPanel({ alerts }) {
  return (
    <section className="glass rounded-xl p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Network Alerts</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Active Service Events</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{alerts.length} active</span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{alert.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{alert.message}</p>
              </div>
              <StatusBadge value={alert.severity} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Priority {alert.priority_score ?? "--"}/100</span>
              <span>{alert.status}</span>
            </div>
          </article>
        ))}
        {!alerts.length && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No active network alerts in the current monitoring window.
          </div>
        )}
      </div>
    </section>
  );
}
