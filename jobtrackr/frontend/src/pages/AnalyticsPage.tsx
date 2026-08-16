import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, Users, Award, Clock } from "lucide-react";
import { Layout } from "../components/Layout";
import { api, getErrorMessage } from "../lib/api";
import { AnalyticsResponse, STATUS_LABELS, STATUS_COLORS, ApplicationStatus } from "../types";

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1A` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-sm font-medium text-ink-500">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink-900">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
    </div>
  );
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-sm text-ink-500">Crunching numbers…</div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-sm text-rose-600">{error}</div>
      </Layout>
    );
  }

  const pieData = (Object.entries(data.statusCounts) as [ApplicationStatus, number][])
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: STATUS_LABELS[status], value: count, color: STATUS_COLORS[status] }));

  const trendData = data.monthlyApplications.map((m) => ({ month: monthLabel(m.month), count: m.count }));

  const sourceData = data.bySource
    .sort((a, b) => b.total - a.total)
    .map((s) => ({ source: s.source, Applications: s.total, Offers: s.offers }));

  return (
    <Layout>
      <div className="h-full overflow-y-auto px-8 py-6">
        <header className="mb-6">
          <h1 className="font-display text-xl font-semibold text-ink-900">Analytics</h1>
          <p className="text-sm text-ink-500">Your job search performance at a glance</p>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Users} label="Total Applications" value={String(data.totals.applications)} color="#3B82F6" />
          <StatCard
            icon={TrendingUp}
            label="Interview Rate"
            value={`${data.rates.interviewRate}%`}
            sublabel={`${data.totals.interviews} interviews scheduled`}
            color="#8B5CF6"
          />
          <StatCard
            icon={Award}
            label="Offer Conversion"
            value={`${data.rates.offerRate}%`}
            sublabel={`${data.totals.offers} offers received`}
            color="#14B8A6"
          />
          <StatCard
            icon={Clock}
            label="Avg. Days to Interview"
            value={data.avgDaysToInterview !== null ? `${data.avgDaysToInterview}d` : "—"}
            sublabel="from application date"
            color="#F59E0B"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-ink-700">Applications Over Time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fill="url(#colorApps)" name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-ink-700">Pipeline Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1.5">
              {pieData.map((entry) => (
                <li key={entry.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-medium text-ink-800">{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink-700">Source Effectiveness</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Applications" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Offers" fill="#14B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
