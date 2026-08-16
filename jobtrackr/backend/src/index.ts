import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes";
import applicationRoutes, { interviewItemRouter } from "./routes/applicationRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Basic rate limiting to protect the auth endpoints from brute force / abuse.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use("/api/auth", authLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewItemRouter);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`JobTrackr API listening on port ${PORT}`);
});
