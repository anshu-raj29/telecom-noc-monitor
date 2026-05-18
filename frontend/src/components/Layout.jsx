import { Activity, BarChart3, Bell, BrainCircuit, RadioTower, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  ["overview", "Performance Overview", Activity],
  ["kpi", "KPI Status", ShieldCheck],
  ["connectivity", "Connectivity Analytics", BarChart3],
  ["alerts", "Network Alerts", Bell],
  ["predictions", "AI Predictions", BrainCircuit],
  ["risk", "Risk Analysis", ShieldAlert]
];

const titles = Object.fromEntries(navItems.map(([key, label]) => [key, label]));

export default function Layout({ children, lastUpdated, activeSection = "overview", onSectionChange, onRefresh, refreshing }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const updatedLabel = lastUpdated ? relativeTime(lastUpdated, now) : "--";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-800 bg-[#071426] p-6 text-slate-200 lg:block">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
            <RadioTower size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-300">Telecom NOC</p>
            <h1 className="text-base font-semibold text-white">Network Monitor</h1>
          </div>
        </Link>
        <nav className="mt-10 space-y-1.5 text-sm">
          {navItems.map(([key, label, Icon]) => {
            const active = key === activeSection;
            return (
            <button
              key={key}
              type="button"
              onClick={() => onSectionChange?.(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left ${active ? "bg-cyan-400/10 text-white ring-1 ring-cyan-300/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <Icon size={17} className={active ? "text-cyan-300" : "text-slate-500"} />
              <span>{label}</span>
            </button>
          )})}
        </nav>
        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Operations Scope</p>
          <p className="mt-2 text-sm font-medium text-slate-100">Patna cluster</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Live KPI monitoring from the active telecom metrics dataset.</p>
        </div>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Network Monitoring</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">{titles[activeSection] || "Performance Overview"}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Network online
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                Updated {updatedLabel}
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
            {navItems.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onSectionChange?.(key)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium ${key === activeSection ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function relativeTime(value, now) {
  const diff = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (diff < 2) return "just now";
  if (diff < 60) return `${diff} sec ago`;
  const minutes = Math.round(diff / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
