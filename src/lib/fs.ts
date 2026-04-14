import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

export function ensureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

