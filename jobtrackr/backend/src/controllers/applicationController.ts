import { Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/requireAuth";

const STATUS_VALUES = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;
const statusEnum = z.enum(STATUS_VALUES);

const createSchema = z.object({
  company: z.string().min(1).max(150),
  role: z.string().min(1).max(150),
  status: statusEnum.optional(),
  location: z.string().max(150).optional(),
  remote: z.boolean().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  jobDescription: z.string().optional(),
  source: z.string().max(100).optional(),
  notes: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  status: statusEnum.optional(),
  search: z.string().optional(),
  source: z.string().optional(),
  sortBy: z.enum(["appliedDate", "company", "role", "createdAt", "updatedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const SORT_COLUMN: Record<string, string> = {
  appliedDate: "applied_date",
  company: "company",
  role: "role",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

// Maps a snake_case DB row to the camelCase shape the frontend expects.
function toApplication(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    company: row.company,
    role: row.role,
    status: row.status,
    location: row.location,
    remote: row.remote,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    jobUrl: row.job_url,
    jobDescription: row.job_description,
    source: row.source,
    notes: row.notes,
    appliedDate: row.applied_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.interview_count !== undefined ? { interviewCount: Number(row.interview_count) } : {}),
  };
}

async function assertOwnership(applicationId: string, userId: string) {
  const result = await query("SELECT * FROM applications WHERE id = $1", [applicationId]);
  const app = result.rows[0];
  if (!app || app.user_id !== userId) {
    throw new ApiError(404, "Application not found");
  }
  return app;
}

export async function listApplications(req: AuthedRequest, res: Response) {
  const q = querySchema.parse(req.query);
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 50;
  const userId = req.user!.userId;

  const conditions: string[] = ["a.user_id = $1"];
  const params: unknown[] = [userId];

  if (q.status) {
    params.push(q.status);
    conditions.push(`a.status = $${params.length}`);
  }
  if (q.source) {
    params.push(q.source);
    conditions.push(`a.source ILIKE $${params.length}`);
  }
  if (q.search) {
    params.push(`%${q.search}%`);
    const idx = params.length;
    conditions.push(
      `(a.company ILIKE $${idx} OR a.role ILIKE $${idx} OR a.location ILIKE $${idx} OR a.notes ILIKE $${idx})`
    );
  }

  const whereClause = conditions.join(" AND ");
  const sortCol = SORT_COLUMN[q.sortBy ?? "appliedDate"];
  const sortDir = q.sortDir === "asc" ? "ASC" : "DESC";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM applications a WHERE ${whereClause}`,
    params
  );
  const total = Number(countResult.rows[0].count);

  params.push(pageSize, (page - 1) * pageSize);
  const itemsResult = await query(
    `SELECT a.*, COUNT(i.id) AS interview_count
     FROM applications a
     LEFT JOIN interviews i ON i.application_id = a.id
     WHERE ${whereClause}
     GROUP BY a.id
     ORDER BY a.${sortCol} ${sortDir}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    items: itemsResult.rows.map(toApplication),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getApplication(req: AuthedRequest, res: Response) {
  const app = await assertOwnership(req.params.id, req.user!.userId);
  const interviews = await query(
    "SELECT * FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC",
    [app.id]
  );
  res.json({
    application: {
      ...toApplication(app),
      interviews: interviews.rows.map((i) => ({
        id: i.id,
        applicationId: i.application_id,
        roundName: i.round_name,
        type: i.type,
        scheduledAt: i.scheduled_at,
        interviewer: i.interviewer,
        outcome: i.outcome,
        notes: i.notes,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      })),
    },
  });
}

export async function createApplication(req: AuthedRequest, res: Response) {
  const data = createSchema.parse(req.body);

  const result = await query(
    `INSERT INTO applications
       (user_id, company, role, status, location, remote, salary_min, salary_max, job_url, job_description, source, notes, applied_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13, now()))
     RETURNING *`,
    [
      req.user!.userId,
      data.company,
      data.role,
      data.status ?? "APPLIED",
      data.location ?? null,
      data.remote ?? false,
      data.salaryMin ?? null,
      data.salaryMax ?? null,
      data.jobUrl || null,
      data.jobDescription ?? null,
      data.source ?? null,
      data.notes ?? null,
      data.appliedDate ? new Date(data.appliedDate) : null,
    ]
  );

  res.status(201).json({ application: toApplication(result.rows[0]) });
}

export async function updateApplication(req: AuthedRequest, res: Response) {
  const app = await assertOwnership(req.params.id, req.user!.userId);
  const data = updateSchema.parse(req.body);

  const fieldMap: Record<string, unknown> = {
    company: data.company,
    role: data.role,
    status: data.status,
    location: data.location,
    remote: data.remote,
    salary_min: data.salaryMin,
    salary_max: data.salaryMax,
    job_url: data.jobUrl === undefined ? undefined : data.jobUrl || null,
    job_description: data.jobDescription,
    source: data.source,
    notes: data.notes,
    applied_date: data.appliedDate ? new Date(data.appliedDate) : undefined,
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  for (const [col, value] of Object.entries(fieldMap)) {
    if (value === undefined) continue;
    params.push(value);
    setClauses.push(`${col} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return res.json({ application: toApplication(app) });
  }

  params.push(app.id);
  const result = await query(
    `UPDATE applications SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );

  res.json({ application: toApplication(result.rows[0]) });
}

// Lightweight endpoint dedicated to Kanban drag-and-drop status changes.
const statusOnlySchema = z.object({ status: statusEnum });

export async function updateApplicationStatus(req: AuthedRequest, res: Response) {
  const app = await assertOwnership(req.params.id, req.user!.userId);
  const { status } = statusOnlySchema.parse(req.body);

  const result = await query("UPDATE applications SET status = $1 WHERE id = $2 RETURNING *", [
    status,
    app.id,
  ]);

  res.json({ application: toApplication(result.rows[0]) });
}

export async function deleteApplication(req: AuthedRequest, res: Response) {
  const app = await assertOwnership(req.params.id, req.user!.userId);
  await query("DELETE FROM applications WHERE id = $1", [app.id]);
  res.status(204).send();
}
