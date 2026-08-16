import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { Interview, InterviewType, InterviewOutcome, INTERVIEW_TYPE_LABELS } from "../types";

interface Props {
  applicationId: string;
  interview?: Interview;
  onClose: () => void;
  onSaved: () => void;
}

const TYPES: InterviewType[] = ["PHONE_SCREEN", "TECHNICAL", "BEHAVIORAL", "ONSITE", "FINAL", "OTHER"];
const OUTCOMES: InterviewOutcome[] = ["PENDING", "PASSED", "FAILED", "CANCELLED"];

function toLocalInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function InterviewFormModal({ applicationId, interview, onClose, onSaved }: Props) {
  const isEdit = !!interview;
  const [roundName, setRoundName] = useState(interview?.roundName ?? "");
  const [type, setType] = useState<InterviewType>(interview?.type ?? "TECHNICAL");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(interview?.scheduledAt));
  const [interviewer, setInterviewer] = useState(interview?.interviewer ?? "");
  const [outcome, setOutcome] = useState<InterviewOutcome>(interview?.outcome ?? "PENDING");
  const [notes, setNotes] = useState(interview?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      roundName,
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      interviewer: interviewer || undefined,
      outcome,
      notes: notes || undefined,
    };

    try {
      if (isEdit) {
        await api.patch(`/interviews/${interview!.id}`, payload);
      } else {
        await api.post(`/applications/${applicationId}/interviews`, payload);
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {isEdit ? "Edit Interview" : "Add Interview Round"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
          )}

          <label className="mb-1 block text-sm font-medium text-ink-700">Round name *</label>
          <input
            required
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            placeholder="e.g. Technical Round 1"
            className="mb-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InterviewType)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {INTERVIEW_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as InterviewOutcome)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0) + o.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mb-1 block text-sm font-medium text-ink-700">Date & time *</label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mb-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <label className="mb-1 block text-sm font-medium text-ink-700">Interviewer</label>
          <input
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            className="mb-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <label className="mb-1 block text-sm font-medium text-ink-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mb-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <div className="mt-4 flex justify-end gap-3">
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
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
