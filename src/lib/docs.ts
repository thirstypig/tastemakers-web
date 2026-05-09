import fs from "fs";
import path from "path";

export type DocSource =
  | { type: "local"; file: string }
  | { type: "github"; repo: string; branch: string; file: string };

export async function fetchMarkdown(source: DocSource): Promise<string | null> {
  if (source.type === "local") {
    try {
      return fs.readFileSync(path.join(process.cwd(), source.file), "utf-8");
    } catch {
      return null;
    }
  }
  const url = `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${source.file}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } } as RequestInit);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
