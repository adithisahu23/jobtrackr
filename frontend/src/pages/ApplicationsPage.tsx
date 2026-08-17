import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ExternalLink } from "lucide-react";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { api, getErrorMessage } from "../lib/api";
import { Application, ApplicationStatus, STATUS_LABELS, STATUS_ORDER } from "../types";
import { formatDate, formatSalaryRange } from "../lib/format";

export function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", {
        params: {
          pageSize: 100,
          search: search || undefined,
          status: statusFilter || undefined,
          sortBy: "appliedDate",
          sortDir: "desc",
        },
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <header className="border-b border-ink-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-semibold text-ink-900">Applications</h1>
              <p className="text-sm text-ink-500">{total} total applications</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus size={16} />
              New Application
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, role, location, notes…"
                className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
              className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All statuses</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
        )}

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-ink-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-ink-500">
              <p className="font-medium text-ink-700">No applications found</p>
              <p className="mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Company / Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Salary</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.map((app) => (
                    <tr key={app.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <Link to={`/applications/${app.id}`} className="block">
                          <p className="font-medium text-ink-900">{app.company}</p>
                          <p className="text-xs text-ink-500">{app.role}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {app.location || "—"}
                        {app.remote && <span className="ml-1 text-xs text-brand-600">(Remote)</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {formatSalaryRange(app.salaryMin, app.salaryMax)}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{formatDate(app.appliedDate)}</td>
                      <td className="px-4 py-3 text-ink-600">{app.source || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          View <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <ApplicationFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </Layout>
  );
}
