import fs from "fs";
import path from "path";

export interface Diagram {
  filename: string;
  title: string;
  content: string;
}

/** Strip leading numeric prefix (e.g. "01-", "09b-") and .mmd, then title-case. */
export function titleFromFilename(filename: string): string {
  const withoutNum = filename.replace(/^\d+[a-z]*-/, "");
  const withoutExt = withoutNum.replace(/\.mmd$/, "");
  return withoutExt
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Read every *.mmd from <project-root>/diagrams/ at request/build time. */
export function readDiagrams(): Diagram[] {
  const dir = path.join(process.cwd(), "diagrams");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mmd"))
    .sort()
    .map((filename) => ({
      filename,
      title: titleFromFilename(filename),
      content: fs.readFileSync(path.join(dir, filename), "utf-8"),
    }));
}
