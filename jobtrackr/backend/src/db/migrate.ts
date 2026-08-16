import "dotenv/config";
import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  console.log("Running migrations against", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  await pool.query(sql);
  console.log("Migrations applied successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
