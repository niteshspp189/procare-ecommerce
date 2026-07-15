import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { spawn } from "child_process";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: "DATABASE_URL is not set" });
  }

  // Set response headers for direct download
  res.setHeader("Content-Disposition", `attachment; filename="procare_backup_${new Date().toISOString().slice(0, 10)}.sql.gz"`);
  res.setHeader("Content-Type", "application/gzip");

  // Spawn pg_dump and gzip processes
  const pgDump = spawn("pg_dump", [dbUrl]);
  const gzip = spawn("gzip");

  // Pipe stdout
  pgDump.stdout.pipe(gzip.stdin);
  gzip.stdout.pipe(res);

  // Error handling
  pgDump.stderr.on("data", (data) => {
    console.error(`pg_dump stderr: ${data}`);
  });

  gzip.stderr.on("data", (data) => {
    console.error(`gzip stderr: ${data}`);
  });

  pgDump.on("close", (code) => {
    if (code !== 0) {
      console.error(`pg_dump process exited with code ${code}`);
    }
  });

  gzip.on("close", (code) => {
    if (code !== 0) {
      console.error(`gzip process exited with code ${code}`);
    }
  });
}
