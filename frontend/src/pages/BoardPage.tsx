import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Layout } from "../components/Layout";
import { KanbanCard } from "../components/KanbanCard";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { api, getErrorMessage } from "../lib/api";
import { Application, ApplicationStatus, STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from "../types";

const BOARD_STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export function BoardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { pageSize: 100 } });
      setApplications(res.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDragEnd(result: DropResult) {
    const { destination, draggableId, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ApplicationStatus;
    const previous = applications;

    // Optimistic update so the drag feels instant.
    setApplications((prev) =>
      prev.map((app) => (app.id === draggableId ? { ...app, status: newStatus } : app))
    );

    try {
      await api.patch(`/applications/${draggableId}/status`, { status: newStatus });
    } catch (err) {
      setApplications(previous);
      setError(getErrorMessage(err));
    }
  }

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-ink-200 bg-white px-8 py-5">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">Application Board</h1>
            <p className="text-sm text-ink-500">Drag cards across stages as your applications move</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={16} />
            New Application
          </button>
        </header>

        {error && (
          <div className="mx-8 mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
        )}

        <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 py-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-ink-500">Loading board…</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex h-full gap-4">
                {BOARD_STATUSES.map((status) => {
                  const columnApps = applications
                    .filter((a) => a.status === status)
                    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
                  return (
                    <div key={status} className="flex w-72 shrink-0 flex-col">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[status] }}
                          />
                          <h2 className="text-sm font-semibold text-ink-700">{STATUS_LABELS[status]}</h2>
                        </div>
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
                          {columnApps.length}
                        </span>
                      </div>

                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 space-y-2 overflow-y-auto rounded-xl p-2 transition-colors ${
                              snapshot.isDraggingOver ? "bg-brand-50" : "bg-ink-100/60"
                            }`}
                          >
                            {columnApps.map((app, index) => (
                              <KanbanCard key={app.id} application={app} index={index} />
                            ))}
                            {provided.placeholder}
                            {columnApps.length === 0 && (
                              <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400">
                                No applications
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
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
