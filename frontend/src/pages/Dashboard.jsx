import { AlertTriangle, RadioTower, ShieldCheck, Signal, TowerControl, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAlerts, getDashboard, getKpis, getMlOverview, getNetworkHealth } from "../api/client";
import AlertsPanel from "../components/AlertsPanel";
import Layout from "../components/Layout";
import NetworkMap from "../components/NetworkMap";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import HealthPieChart from "../charts/HealthPieChart";
import KpiLineChart from "../charts/KpiLineChart";
import RiskMatrix from "../charts/RiskMatrix";
import TowerComparisonChart from "../charts/TowerComparisonChart";

function display(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "--";
  return `${value}${suffix}`;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState({});
  const [mlOverview, setMlOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  async function refresh(showSpinner = false) {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const dashboardData = await getDashboard({ advance: true });
      const [kpiData, alertData, healthData, mlData] = await Promise.all([
        getKpis(), getAlerts(), getNetworkHealth(), getMlOverview()
      ]);
      setDashboard(dashboardData);
      setKpis(kpiData);
      setAlerts(alertData);
      setHealth(healthData);
      setMlOverview(mlData);
      setLastUpdated(new Date().toISOString());
      setMessage("");
    } catch (error) {
      setMessage("Network service is unavailable. Check the backend process and MongoDB connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function initialRefresh() {
      if (active) await refresh(true);
    }
    initialRefresh();
    const interval = setInterval(() => active && refresh(), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const predictions = mlOverview?.predictions || [];
  const signalTrend = dashboard?.signal_trend || [];
  const networkTypeHealth = dashboard?.network_type_health || [];
  const criticalSites = useMemo(() => [...kpis].sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0)).slice(0, 8), [kpis]);

  return (
    <Layout
      lastUpdated={lastUpdated}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onRefresh={() => refresh(false)}
      refreshing={refreshing}
    >
      {message && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{message}</div>}
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {activeSection === "overview" && <Overview dashboard={dashboard} health={health} kpis={kpis} alerts={alerts} criticalSites={criticalSites} />}
          {activeSection === "kpi" && <KpiStatus kpis={kpis} />}
          {activeSection === "connectivity" && <Connectivity signalTrend={signalTrend} networkTypeHealth={networkTypeHealth} />}
          {activeSection === "sites" && <SiteMonitoring kpis={kpis} health={health} />}
          {activeSection === "alerts" && <NetworkAlerts alerts={alerts} />}
          {activeSection === "predictions" && <AiPredictions predictions={predictions} />}
          {activeSection === "risk" && <RiskAnalysis kpis={kpis} predictions={predictions} />}
        </>
      )}
    </Layout>
  );
}

function Overview({ dashboard, health, kpis, alerts, criticalSites }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Patna cluster monitoring</p>
        <p className="mt-1 text-sm text-slate-500">{dashboard?.total_samples ?? 0} network samples across {dashboard?.total_towers ?? 0} monitored localities</p>
      </section>
      <KpiCards dashboard={dashboard} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <NetworkMap towers={kpis} />
        <HealthPieChart health={health} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
        <PrioritySites sites={criticalSites} />
        <AlertsPanel alerts={alerts.slice(0, 5)} />
      </div>
    </div>
  );
}

function KpiCards({ dashboard }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Localities" value={dashboard?.total_towers ?? "--"} icon={RadioTower} tone="cyan" footnote="Monitored areas" />
      <StatCard label="Available Sites" value={dashboard?.active_towers ?? "--"} icon={Signal} tone="green" footnote="UP or degraded" />
      <StatCard label="Unavailable" value={dashboard?.down_towers ?? "--"} icon={WifiOff} tone="red" footnote="Critical risk" />
      <StatCard label="Critical Events" value={dashboard?.critical_alerts ?? "--"} icon={AlertTriangle} tone="amber" footnote="Active impact" />
      <StatCard label="Site Health" value={dashboard?.network_health_score ?? "--"} unit="/100" icon={TowerControl} tone="violet" footnote="Weighted KPI score" />
      <StatCard label="Availability" value={dashboard?.sla_compliance ?? "--"} unit="%" icon={ShieldCheck} tone="green" footnote="Healthy sites" />
    </div>
  );
}

function KpiStatus({ kpis }) {
  return (
    <section className="glass rounded-xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">KPI Status</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Current Site Scorecard</h3>
        </div>
        <p className="text-sm text-slate-500">Weighted by signal 30%, throughput 35%, latency 35%</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((site) => (
          <article key={site.tower_code} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{site.tower_code}</p>
                <p className="mt-1 text-xs text-slate-500">{site.network_type} network</p>
              </div>
              <StatusBadge value={site.health_label} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <MetricTile label="Signal" value={display(site.rsrp, " dBm")} risk={site.signal_risk} />
              <MetricTile label="Throughput" value={display(site.throughput_mbps, " Mbps")} risk={site.throughput_risk} />
              <MetricTile label="Latency" value={display(site.latency_ms, " ms")} risk={site.latency_risk} />
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${site.risk_score >= 70 ? "bg-rose-600" : site.risk_score >= 40 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${Math.min(100, site.risk_score || 0)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Overall risk {site.risk_score}/100</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Connectivity({ signalTrend, networkTypeHealth }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <KpiLineChart data={signalTrend} metric="rsrp" title="Signal Strength Trend (dBm)" color="#0f766e" />
      <KpiLineChart data={signalTrend} metric="latency_ms" title="Latency Overview (ms)" color="#d97706" />
      <KpiLineChart data={signalTrend} metric="throughput_mbps" title="Throughput Analysis (Mbps)" color="#2563eb" />
      <TowerComparisonChart data={networkTypeHealth} />
    </div>
  );
}

function SiteMonitoring({ kpis, health }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <NetworkMap towers={kpis} />
      <HealthPieChart health={health} />
    </div>
  );
}

function NetworkAlerts({ alerts }) {
  return <AlertsPanel alerts={alerts} />;
}

function AiPredictions({ predictions }) {
  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">AI Predictions</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">Operational Risk Forecast</h3>
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {["Locality", "Current Status", "Predicted Status", "Risk Score", "Congestion", "Alert Priority"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {predictions.map((item) => (
              <tr key={item.locality} className="border-t border-slate-100">
                <td className="truncate px-4 py-3 font-medium text-slate-950">{item.locality}</td>
                <td className="px-4 py-3"><StatusBadge value={item.currentStatus} /></td>
                <td className="px-4 py-3"><StatusBadge value={item.predictedStatus} /></td>
                <td className="px-4 py-3">{item.riskScore}/100</td>
                <td className="px-4 py-3"><StatusBadge value={item.congestionRisk} /></td>
                <td className="px-4 py-3">{item.priorityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-3 lg:hidden">
        {predictions.map((item) => (
          <article key={item.locality} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-950">{item.locality}</p>
              <StatusBadge value={item.predictedStatus} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
              <span>Current: {item.currentStatus}</span>
              <span>Risk: {item.riskScore}/100</span>
              <span>Congestion: {item.congestionRisk}</span>
              <span>Priority: {item.priorityScore}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskAnalysis({ kpis, predictions }) {
  const highRisk = predictions.filter((item) => item.riskScore >= 70).length;
  const mediumRisk = predictions.filter((item) => item.riskScore >= 40 && item.riskScore < 70).length;
  const stable = predictions.filter((item) => item.riskScore < 40).length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="High Priority Sites" value={highRisk} tone="red" />
        <SummaryCard label="Watchlist Sites" value={mediumRisk} tone="amber" />
        <SummaryCard label="Stable Sites" value={stable} tone="green" />
        <SummaryCard label="Analyzed Sites" value={predictions.length} tone="cyan" />
      </div>
      <RiskMatrix data={kpis} />
    </div>
  );
}

function PrioritySites({ sites }) {
  return (
    <section className="glass rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk Analysis</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">Sites Requiring Review</h3>
      <div className="mt-4 space-y-3">
        {sites.map((site) => (
          <div key={site.tower_code} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-950">{site.tower_code}</p>
              <p className="text-xs text-slate-500">Latency {site.latency_ms} ms · Throughput {site.throughput_mbps} Mbps</p>
            </div>
            <StatusBadge value={site.health_label} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricTile({ label, value, risk }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate font-medium text-slate-950">{value}</p>
      <p className={`mt-1 text-xs ${risk >= 70 ? "text-rose-700" : risk >= 40 ? "text-amber-700" : "text-emerald-700"}`}>Risk {risk}</p>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700"
  };
  return (
    <div className={`rounded-xl border p-5 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-white" />)}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-white" />
    </div>
  );
}
