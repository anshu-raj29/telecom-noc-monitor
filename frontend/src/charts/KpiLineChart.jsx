import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function KpiLineChart({ data, metric = "rsrp", title = "KPI Trend", color = "#0f766e" }) {
  const chartData = data.map((item, index) => ({
    time: item.sample_time ? new Date(item.sample_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : `T-${data.length - index}`,
    [metric]: Number(item[metric] ?? 0)
  }));

  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Connectivity Metrics</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dbe3ef", borderRadius: 8, color: "#172033" }} />
            <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
