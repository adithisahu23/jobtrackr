import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { Application, ApplicationStatus, STATUS_LABELS, STATUS_ORDER } from "../types";

interface Props {
  application?: Application;
  onClose: () => void;
  onSaved: () => void;
}

export function ApplicationFormModal({ application, onClose, onSaved }: Props) {
  const isEdit = !!application;
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? "APPLIED");
  const [location, setLocation] = useState(application?.location ?? "");
  const [remote, setRemote] = useState(application?.remote ?? false);
  const [salaryMin, setSalaryMin] = useState(application?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(application?.salaryMax?.toString() ?? "");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [source, setSource] = useState(application?.source ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      company,
      role,
      status,
      location: location || undefined,
      remote,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      jobUrl: jobUrl || undefined,
      source: source || undefined,
      notes: notes || undefined,
    };

    try {
      if (isEdit) {
        await api.patch(`/applications/${application!.id}`, payload);
      } else {
        await api.post("/applications", payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {isEdit ? "Edit Application" : "New Application"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-ink-700">Company *</label>
              <input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-ink-700">Role *</label>
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Salary Min</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="800000"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Salary Max</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="1400000"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink-700">Job URL</label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Source</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="LinkedIn, Referral..."
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Remote role
              </label>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
