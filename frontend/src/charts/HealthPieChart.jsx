import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#0f766e", "#d97706", "#e11d48"];

export default function HealthPieChart({ health }) {
  const data = [
    { name: "Healthy", value: health.healthy || 0 },
    { name: "Warning", value: health.warning || 0 },
    { name: "Critical", value: health.critical || 0 }
  ];

  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Site Health</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">Tower Availability</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
              {data.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dbe3ef", borderRadius: 8, color: "#172033" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        {data.map((item, index) => (
          <div key={item.name} className="rounded-lg bg-slate-50 p-3">
            <p style={{ color: colors[index] }} className="font-semibold">{item.value}</p>
            <p className="text-xs text-slate-500">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
