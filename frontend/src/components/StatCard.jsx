export default function StatCard({ label, value, unit, icon: Icon, tone = "cyan", footnote }) {
  const tones = {
    cyan: "text-cyan-700 bg-cyan-50 border-cyan-200",
    violet: "text-slate-700 bg-slate-50 border-slate-200",
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red: "text-rose-700 bg-rose-50 border-rose-200"
  };

  return (
    <section className="glass metric-glow min-h-[148px] rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-3xl font-semibold tracking-tight text-slate-950">{value}</span>
            {unit && <span className="pb-1 text-sm text-slate-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`grid h-10 w-10 place-items-center rounded-lg border ${tones[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {footnote && <p className="mt-5 text-sm leading-5 text-slate-500">{footnote}</p>}
    </section>
  );
}
