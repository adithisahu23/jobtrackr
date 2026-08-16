export type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export const STATUS_ORDER: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  WISHLIST: "var(--color-status-wishlist)",
  APPLIED: "var(--color-status-applied)",
  SCREENING: "var(--color-status-screening)",
  INTERVIEW: "var(--color-status-interview)",
  OFFER: "var(--color-status-offer)",
  REJECTED: "var(--color-status-rejected)",
  WITHDRAWN: "var(--color-status-withdrawn)",
};

export type InterviewType = "PHONE_SCREEN" | "TECHNICAL" | "BEHAVIORAL" | "ONSITE" | "FINAL" | "OTHER";
export type InterviewOutcome = "PENDING" | "PASSED" | "FAILED" | "CANCELLED";

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  ONSITE: "Onsite",
  FINAL: "Final / HR",
  OTHER: "Other",
};

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  roundName: string;
  type: InterviewType;
  scheduledAt: string;
  interviewer: string | null;
  outcome: InterviewOutcome;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  jobUrl: string | null;
  jobDescription: string | null;
  source: string | null;
  notes: string | null;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
  interviewCount?: number;
  interviews?: Interview[];
}

export interface PaginatedApplications {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AnalyticsResponse {
  totals: {
    applications: number;
    interviews: number;
    offers: number;
    rejections: number;
  };
  statusCounts: Record<ApplicationStatus, number>;
  monthlyApplications: { month: string; count: number }[];
  rates: {
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    offerConversionFromInterview: number;
  };
  avgDaysToInterview: number | null;
  bySource: { source: string; total: number; offers: number }[];
}
