import { ArrowLeft, AlertTriangle, Clock, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTower } from "../api/client";
import KpiLineChart from "../charts/KpiLineChart";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function TowerDetail() {
  const { towerId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    getTower(towerId).then(setData);
  }, [towerId]);

  const tower = data?.tower;
  const history = data?.history || [];

  return (
    <Layout>
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-600">
        <ArrowLeft size={16} /> Back to network overview
      </Link>
      {tower && (
        <>
          <section className="glass rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tower Status</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">{tower.tower_code}</h2>
                <p className="mt-2 text-slate-500">{tower.region} - {tower.vendor}</p>
              </div>
              <StatusBadge value={tower.status} />
            </div>
          </section>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <StatCard label="Health Score" value={tower.health_score} unit="/100" icon={Gauge} tone="violet" />
            <StatCard label="Service Severity" value={tower.severity} icon={AlertTriangle} tone={tower.severity === "Critical" ? "red" : "amber"} />
            <StatCard label="Last Sample" value={new Date(tower.sample_time).toLocaleTimeString()} icon={Clock} tone="cyan" />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <KpiLineChart data={history} metric="throughput_mbps" title="Throughput Trend" color="#0f766e" />
            <KpiLineChart data={history} metric="latency_ms" title="Latency Analytics" color="#d97706" />
            <KpiLineChart data={history} metric="rsrp" title="Signal Strength Trend" color="#2563eb" />
            <KpiLineChart data={history} metric="signal_quality" title="Signal Quality Trend" color="#7c3aed" />
          </div>
        </>
      )}
    </Layout>
  );
}
