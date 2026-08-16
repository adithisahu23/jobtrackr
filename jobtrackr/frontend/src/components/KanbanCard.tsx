import { Draggable } from "@hello-pangea/dnd";
import { MapPin, MessageSquareText } from "lucide-react";
import { Application } from "../types";
import { timeAgo } from "../lib/format";
import { Link } from "react-router-dom";

export function KanbanCard({ application, index }: { application: Application; index: number }) {
  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <Link
          to={`/applications/${application.id}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`block rounded-xl border border-ink-200 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md ${
            snapshot.isDragging ? "rotate-1 shadow-lg" : ""
          }`}
        >
          <p className="truncate text-sm font-semibold text-ink-900">{application.company}</p>
          <p className="mt-0.5 truncate text-xs text-ink-600">{application.role}</p>

          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-500">
            <div className="flex items-center gap-1">
              {application.location && (
                <>
                  <MapPin size={12} />
                  <span className="truncate max-w-[100px]">{application.location}</span>
                </>
              )}
            </div>
            <span>{timeAgo(application.appliedDate)}</span>
          </div>

          {!!application.interviewCount && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-violet-600">
              <MessageSquareText size={12} />
              {application.interviewCount} interview{application.interviewCount === 1 ? "" : "s"}
            </div>
          )}
        </Link>
      )}
    </Draggable>
  );
}
