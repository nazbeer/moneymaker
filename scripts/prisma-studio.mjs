import "dotenv/config";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for Prisma Studio");

// Prisma 8 has no Studio command; the documented standalone Studio 7 needs no contract.
const result = spawnSync("npx", ["--yes", "prisma@7.10.0", "studio", "--url", process.env.DATABASE_URL], {
  cwd: tmpdir(),
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
