import { Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { hashPassword, comparePassword, signToken } from "../utils/auth";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/requireAuth";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function toPublicUser(user: UserRow) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at };
}

export async function register(req: AuthedRequest, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await query<UserRow>("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  const result = await query<UserRow>(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, password_hash, created_at`,
    [name, email, passwordHash]
  );
  const user = result.rows[0];

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req: AuthedRequest, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const result = await query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: toPublicUser(user) });
}

export async function me(req: AuthedRequest, res: Response) {
  const result = await query<UserRow>("SELECT * FROM users WHERE id = $1", [req.user!.userId]);
  const user = result.rows[0];
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: toPublicUser(user) });
}
