import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Plus, ExternalLink, MapPin, DollarSign,
  Calendar, Tag, User as UserIcon, Video,
} from "lucide-react";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { InterviewFormModal } from "../components/InterviewFormModal";
import { api, getErrorMessage } from "../lib/api";
import { Application, Interview, INTERVIEW_TYPE_LABELS } from "../types";
import { formatDate, formatDateTime, formatSalaryRange } from "../lib/format";

const OUTCOME_COLOR: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50",
  PASSED: "text-teal-600 bg-teal-50",
  FAILED: "text-rose-600 bg-rose-50",
  CANCELLED: "text-ink-500 bg-ink-100",
};

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | undefined>();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/applications/${id}`);
      setApp(res.data.application);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!app || !confirm(`Delete the application for ${app.company}? This can't be undone.`)) return;
    try {
      await api.delete(`/applications/${app.id}`);
      navigate("/applications");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeleteInterview(interviewId: string) {
    if (!confirm("Delete this interview round?")) return;
    try {
      await api.delete(`/interviews/${interviewId}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-sm text-ink-500">Loading…</div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="flex h-full flex-col items-center justify-center text-sm text-ink-500">
          <p>{error || "Application not found."}</p>
          <Link to="/applications" className="mt-3 text-brand-600 hover:underline">
            Back to applications
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto px-8 py-6">
        <Link
          to="/applications"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft size={16} />
          Back to applications
        </Link>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
        )}

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-900">{app.company}</h1>
              <p className="mt-1 text-ink-600">{app.role}</p>
              <div className="mt-3">
                <StatusBadge status={app.status} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-3">
            <InfoItem icon={MapPin} label="Location" value={app.location || "Not specified"} suffix={app.remote ? " (Remote)" : ""} />
            <InfoItem icon={DollarSign} label="Salary Range" value={formatSalaryRange(app.salaryMin, app.salaryMax)} />
            <InfoItem icon={Calendar} label="Applied On" value={formatDate(app.appliedDate)} />
            <InfoItem icon={Tag} label="Source" value={app.source || "Not specified"} />
            {app.jobUrl && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-500">
                  <ExternalLink size={13} /> Job Posting
                </p>
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  View original listing
                </a>
              </div>
            )}
          </div>

          {app.notes && (
            <div className="mt-6 border-t border-ink-100 pt-6">
              <p className="mb-1 text-xs font-medium text-ink-500">Notes</p>
              <p className="whitespace-pre-wrap text-sm text-ink-700">{app.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">Interview Timeline</h2>
            <button
              onClick={() => {
                setEditingInterview(undefined);
                setShowInterviewForm(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus size={14} />
              Add Round
            </button>
          </div>

          {!app.interviews || app.interviews.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">No interview rounds logged yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {app.interviews.map((interview) => (
                <li
                  key={interview.id}
                  className="flex items-start justify-between rounded-xl border border-ink-100 p-4"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <Video size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{interview.roundName}</p>
                      <p className="text-xs text-ink-500">
                        {INTERVIEW_TYPE_LABELS[interview.type]} · {formatDateTime(interview.scheduledAt)}
                      </p>
                      {interview.interviewer && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                          <UserIcon size={12} /> {interview.interviewer}
                        </p>
                      )}
                      {interview.notes && <p className="mt-1 text-xs text-ink-600">{interview.notes}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${OUTCOME_COLOR[interview.outcome]}`}>
                      {interview.outcome.charAt(0) + interview.outcome.slice(1).toLowerCase()}
                    </span>
                    <button
                      onClick={() => {
                        setEditingInterview(interview);
                        setShowInterviewForm(true);
                      }}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteInterview(interview.id)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showEdit && (
        <ApplicationFormModal
          application={app}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}

      {showInterviewForm && (
        <InterviewFormModal
          applicationId={app.id}
          interview={editingInterview}
          onClose={() => setShowInterviewForm(false)}
          onSaved={() => {
            setShowInterviewForm(false);
            load();
          }}
        />
      )}
    </Layout>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  suffix = "",
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <Icon size={13} /> {label}
      </p>
      <p className="text-sm text-ink-800">
        {value}
        {suffix}
      </p>
    </div>
  );
}
