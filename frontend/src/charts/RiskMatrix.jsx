export default function RiskMatrix({ data }) {
  const metrics = [
    ["signal_risk", "Signal"],
    ["throughput_risk", "Throughput"],
    ["latency_risk", "Latency"],
    ["risk_score", "Overall"]
  ];

  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">KPI Status</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">Site Risk Matrix</h3>
      <div className="mt-5 space-y-2">
          <div className="grid grid-cols-[minmax(96px,1.2fr)_repeat(4,minmax(42px,1fr))] gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>Locality</span>
            {metrics.map(([, label]) => <span key={label}>{label}</span>)}
          </div>
          {data.map((site) => (
            <div key={site.tower_code} className="grid grid-cols-[minmax(96px,1.2fr)_repeat(4,minmax(42px,1fr))] gap-2 text-xs">
              <div className="truncate pt-2 font-medium text-slate-700">{site.tower_code}</div>
              {metrics.map(([metric, label]) => {
                const risk = Number(site[metric] || 0);
                return (
                  <div
                    key={metric}
                    className="h-8 rounded-md border border-slate-200"
                    style={{ background: riskColor(risk) }}
                    title={`${label}: ${site[metric] ?? "--"}`}
                  />
                );
              })}
            </div>
          ))}
      </div>
    </section>
  );
}

function riskColor(risk) {
  if (risk > 70) return `rgba(225,29,72,${0.16 + risk / 150})`;
  if (risk > 45) return `rgba(217,119,6,${0.14 + risk / 150})`;
  return `rgba(15,118,110,${0.12 + risk / 150})`;
}
