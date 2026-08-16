import { Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/requireAuth";

const TYPE_VALUES = ["PHONE_SCREEN", "TECHNICAL", "BEHAVIORAL", "ONSITE", "FINAL", "OTHER"] as const;
const OUTCOME_VALUES = ["PENDING", "PASSED", "FAILED", "CANCELLED"] as const;

const createSchema = z.object({
  roundName: z.string().min(1).max(150),
  type: z.enum(TYPE_VALUES).optional(),
  scheduledAt: z.string().datetime(),
  interviewer: z.string().max(150).optional(),
  outcome: z.enum(OUTCOME_VALUES).optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

function toInterview(row: Record<string, unknown>) {
  return {
    id: row.id,
    applicationId: row.application_id,
    roundName: row.round_name,
    type: row.type,
    scheduledAt: row.scheduled_at,
    interviewer: row.interviewer,
    outcome: row.outcome,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function assertApplicationOwnership(applicationId: string, userId: string) {
  const result = await query("SELECT * FROM applications WHERE id = $1", [applicationId]);
  const app = result.rows[0];
  if (!app || app.user_id !== userId) {
    throw new ApiError(404, "Application not found");
  }
  return app;
}

async function assertInterviewOwnership(interviewId: string, userId: string) {
  const result = await query(
    `SELECT i.*, a.user_id AS owner_id
     FROM interviews i
     JOIN applications a ON a.id = i.application_id
     WHERE i.id = $1`,
    [interviewId]
  );
  const interview = result.rows[0];
  if (!interview || interview.owner_id !== userId) {
    throw new ApiError(404, "Interview not found");
  }
  return interview;
}

export async function listInterviews(req: AuthedRequest, res: Response) {
  await assertApplicationOwnership(req.params.applicationId, req.user!.userId);
  const result = await query(
    "SELECT * FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC",
    [req.params.applicationId]
  );
  res.json({ items: result.rows.map(toInterview) });
}

export async function createInterview(req: AuthedRequest, res: Response) {
  await assertApplicationOwnership(req.params.applicationId, req.user!.userId);
  const data = createSchema.parse(req.body);

  const result = await query(
    `INSERT INTO interviews (application_id, round_name, type, scheduled_at, interviewer, outcome, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      req.params.applicationId,
      data.roundName,
      data.type ?? "OTHER",
      new Date(data.scheduledAt),
      data.interviewer ?? null,
      data.outcome ?? "PENDING",
      data.notes ?? null,
    ]
  );

  res.status(201).json({ interview: toInterview(result.rows[0]) });
}

export async function updateInterview(req: AuthedRequest, res: Response) {
  await assertInterviewOwnership(req.params.id, req.user!.userId);
  const data = updateSchema.parse(req.body);

  const fieldMap: Record<string, unknown> = {
    round_name: data.roundName,
    type: data.type,
    scheduled_at: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    interviewer: data.interviewer,
    outcome: data.outcome,
    notes: data.notes,
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  for (const [col, value] of Object.entries(fieldMap)) {
    if (value === undefined) continue;
    params.push(value);
    setClauses.push(`${col} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    const current = await query("SELECT * FROM interviews WHERE id = $1", [req.params.id]);
    return res.json({ interview: toInterview(current.rows[0]) });
  }

  params.push(req.params.id);
  const result = await query(
    `UPDATE interviews SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );

  res.json({ interview: toInterview(result.rows[0]) });
}

export async function deleteInterview(req: AuthedRequest, res: Response) {
  await assertInterviewOwnership(req.params.id, req.user!.userId);
  await query("DELETE FROM interviews WHERE id = $1", [req.params.id]);
  res.status(204).send();
}
