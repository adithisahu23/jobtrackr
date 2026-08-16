import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
