import { Link } from "react-router-dom";

export default function NetworkMap({ towers }) {
  const bounds = towers.reduce((acc, tower) => ({
    minLat: Math.min(acc.minLat, Number(tower.latitude)),
    maxLat: Math.max(acc.maxLat, Number(tower.latitude)),
    minLon: Math.min(acc.minLon, Number(tower.longitude)),
    maxLon: Math.max(acc.maxLon, Number(tower.longitude))
  }), { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity });

  function position(tower) {
    const lonSpan = bounds.maxLon - bounds.minLon || 1;
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const x = 8 + ((Number(tower.longitude) - bounds.minLon) / lonSpan) * 84;
    const y = 92 - ((Number(tower.latitude) - bounds.minLat) / latSpan) * 84;
    return [x, y];
  }

  return (
    <section className="glass relative overflow-hidden rounded-xl p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Site Location</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Tower Status Map</h3>
        </div>
        <p className="text-sm text-slate-500">{towers.length} localities monitored</p>
      </div>
      <div className="relative h-[380px] rounded-xl border border-slate-200 bg-slate-50">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dbe3ef" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
        {towers.map((tower, index) => {
          const [x, y] = position(tower);
          const color = tower.status === "UP" ? "bg-emerald-500" : tower.status === "DEGRADED" ? "bg-amber-500" : "bg-rose-600";
          return (
            <Link
              to={`/tower/${encodeURIComponent(tower.tower_code)}`}
              key={tower.tower_code}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${tower.tower_code} - ${tower.status} - ${tower.rsrp} dBm`}
            >
              <span className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${color} opacity-15`} />
              <span className={`relative grid h-5 w-5 place-items-center rounded-full ${color} shadow-sm ring-2 ring-white`}>
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="absolute left-4 top-4 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
                {tower.tower_code}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
