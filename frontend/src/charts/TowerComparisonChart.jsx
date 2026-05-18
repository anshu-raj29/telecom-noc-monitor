import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TowerComparisonChart({ data }) {
  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Region Performance</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">Network Type Health</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="network_type" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dbe3ef", borderRadius: 8, color: "#172033" }} />
            <Bar dataKey="health_score" fill="#0f766e" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
