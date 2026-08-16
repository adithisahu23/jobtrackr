import "dotenv/config";
import { pool, query } from "./pool";
import { hashPassword } from "../utils/auth";

const COMPANIES = [
  "Nova Systems", "Brightloop", "Pinecone Labs", "Vertex Analytics", "Cobalt Health",
  "Fernwave", "Ampersand", "Trailmark", "Glide Robotics", "Circuit & Co",
  "Northwind Data", "Solstice AI", "Kindred Software", "Ridgeline", "Meridian Cloud",
];
const ROLES = [
  "Frontend Engineer", "Full Stack Developer", "React Developer", "Software Engineer II",
  "UI Engineer", "Product Engineer", "Web Developer",
];
const SOURCES = ["LinkedIn", "Company Website", "Referral", "Indeed", "AngelList", "Naukri"];
const STATUSES = [
  "APPLIED", "APPLIED", "APPLIED",
  "SCREENING", "SCREENING",
  "INTERVIEW", "INTERVIEW",
  "OFFER",
  "REJECTED", "REJECTED",
  "WITHDRAWN",
];
const LOCATIONS = ["Remote", "Bengaluru", "Hyderabad", "Pune", "Delhi NCR", "Mumbai"];
const INTERVIEWERS = ["Priya S.", "Rahul M.", "Anjali K.", "Recruiting Team"];
const ROUND_NAMES = ["Phone Screen", "Technical Round", "System Design", "Final / HR"];
const INTERVIEW_TYPES = ["PHONE_SCREEN", "TECHNICAL", "BEHAVIORAL", "ONSITE", "FINAL"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const email = "demo@jobtrackr.dev";
  const password = "demo1234";

  const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
  let userId: string;

  if (existingUser.rowCount) {
    userId = existingUser.rows[0].id;
    console.log(`Reusing existing demo user (${email}).`);
  } else {
    const passwordHash = await hashPassword(password);
    const created = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id",
      ["Demo User", email, passwordHash]
    );
    userId = created.rows[0].id;
    console.log(`Created demo user ${email} / password: ${password}`);
  }

  // Clear existing demo applications so the seed is repeatable.
  await query("DELETE FROM applications WHERE user_id = $1", [userId]);

  const total = 55;
  for (let i = 0; i < total; i++) {
    const status = randomFrom(STATUSES);
    const appliedDate = daysAgo(Math.floor(Math.random() * 90));
    const salaryMin = 800000 + Math.floor(Math.random() * 10) * 100000;
    const salaryMax = 1400000 + Math.floor(Math.random() * 10) * 100000;

    const appResult = await query(
      `INSERT INTO applications
        (user_id, company, role, status, location, remote, salary_min, salary_max, job_url, source, notes, applied_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        userId,
        randomFrom(COMPANIES),
        randomFrom(ROLES),
        status,
        randomFrom(LOCATIONS),
        Math.random() > 0.5,
        salaryMin,
        salaryMax,
        "https://example.com/job-posting",
        randomFrom(SOURCES),
        "Auto-generated demo record for portfolio purposes.",
        appliedDate,
      ]
    );
    const applicationId = appResult.rows[0].id;

    if (["INTERVIEW", "OFFER", "REJECTED"].includes(status) && Math.random() > 0.3) {
      const rounds = 1 + Math.floor(Math.random() * 3);
      for (let r = 0; r < rounds; r++) {
        const outcome =
          status === "OFFER"
            ? "PASSED"
            : status === "REJECTED"
            ? randomFrom(["FAILED", "PASSED"])
            : "PENDING";
        await query(
          `INSERT INTO interviews (application_id, round_name, type, scheduled_at, interviewer, outcome, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            applicationId,
            ROUND_NAMES[r] || `Round ${r + 1}`,
            randomFrom(INTERVIEW_TYPES),
            daysAgo(Math.floor(Math.random() * 60)),
            randomFrom(INTERVIEWERS),
            outcome,
            "",
          ]
        );
      }
    }
  }

  console.log(`Seeded ${total} demo applications with interview records.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
