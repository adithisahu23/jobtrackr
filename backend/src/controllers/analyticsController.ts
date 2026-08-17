import { Response } from "express";
import { query } from "../db/pool";
import { AuthedRequest } from "../middleware/requireAuth";

const STATUS_VALUES = ["WISHLIST", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

interface ApplicationRow {
  id: string;
  status: string;
  applied_date: Date;
  source: string | null;
}

interface InterviewRow {
  application_id: string;
  scheduled_at: Date;
}

export async function getAnalytics(req: AuthedRequest, res: Response) {
  const userId = req.user!.userId;

  const [appsResult, interviewsResult] = await Promise.all([
    query<ApplicationRow>(
      "SELECT id, status, applied_date, source FROM applications WHERE user_id = $1",
      [userId]
    ),
    query<InterviewRow>(
      `SELECT i.application_id, i.scheduled_at
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       WHERE a.user_id = $1`,
      [userId]
    ),
  ]);

  const applications = appsResult.rows;
  const interviews = interviewsResult.rows;
  const total = applications.length;

  const statusCounts: Record<string, number> = {};
  for (const s of STATUS_VALUES) statusCounts[s] = 0;
  for (const app of applications) statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;

  const monthly: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = 0;
  }
  for (const app of applications) {
    const d = new Date(app.applied_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthly) monthly[key] += 1;
  }

  const interviewedAppIds = new Set(interviews.map((i) => i.application_id));
  const interviewedCount = interviewedAppIds.size;
  const offers = statusCounts["OFFER"] ?? 0;
  const rejections = statusCounts["REJECTED"] ?? 0;

  const responseRate = total > 0 ? +(((total - statusCounts["APPLIED"]) / total) * 100).toFixed(1) : 0;
  const interviewRate = total > 0 ? +((interviewedCount / total) * 100).toFixed(1) : 0;
  const offerRate = total > 0 ? +((offers / total) * 100).toFixed(1) : 0;
  const offerConversionFromInterview =
    interviewedCount > 0 ? +((offers / interviewedCount) * 100).toFixed(1) : 0;

  const bySource: Record<string, { total: number; offers: number }> = {};
  for (const app of applications) {
    const key = app.source || "Unspecified";
    if (!bySource[key]) bySource[key] = { total: 0, offers: 0 };
    bySource[key].total += 1;
    if (app.status === "OFFER") bySource[key].offers += 1;
  }

  const appliedDateById = new Map(applications.map((a) => [a.id, new Date(a.applied_date)]));
  const firstInterviewByApp = new Map<string, Date>();
  for (const interview of interviews) {
    const scheduled = new Date(interview.scheduled_at);
    const existing = firstInterviewByApp.get(interview.application_id);
    if (!existing || scheduled < existing) {
      firstInterviewByApp.set(interview.application_id, scheduled);
    }
  }
  const daysToInterview: number[] = [];
  for (const [appId, firstInterviewDate] of firstInterviewByApp.entries()) {
    const appliedDate = appliedDateById.get(appId);
    if (!appliedDate) continue;
    const days = Math.max(
      0,
      Math.round((firstInterviewDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    daysToInterview.push(days);
  }
  const avgDaysToInterview =
    daysToInterview.length > 0
      ? +(daysToInterview.reduce((a, b) => a + b, 0) / daysToInterview.length).toFixed(1)
      : null;

  res.json({
    totals: {
      applications: total,
      interviews: interviews.length,
      offers,
      rejections,
    },
    statusCounts,
    monthlyApplications: Object.entries(monthly).map(([month, count]) => ({ month, count })),
    rates: {
      responseRate,
      interviewRate,
      offerRate,
      offerConversionFromInterview,
    },
    avgDaysToInterview,
    bySource: Object.entries(bySource).map(([source, v]) => ({
      source,
      total: v.total,
      offers: v.offers,
    })),
  });
}
