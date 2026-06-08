export type Commit = { sha: string; date: string; subject: string };

export async function fetchCommits(repo: string): Promise<Commit[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=6`,
      { headers: { Accept: "application/vnd.github.v3+json" } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((c: any) => ({
      sha: (c.sha as string).slice(0, 7),
      date: (c.commit.author.date as string).slice(0, 10),
      subject: (c.commit.message as string).split("\n")[0].slice(0, 72),
    }));
  } catch {
    return [];
  }
}
