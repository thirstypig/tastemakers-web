export type Platform = "backend" | "ios" | "android" | "web" | "marketing";
export type Phase = "P1" | "P2" | "P3";
export type Status = "open" | "in_progress" | "done";

export interface TodoItem {
  id: string;
  platform: Platform;
  phase: Phase;
  status: Status;
  title: string;
  detail: string;
  file?: string;
  date: string;
}

export interface Milestone {
  title: string;
  phase: Phase;
  status: Status;
  date: string;
  detail?: string;
}

export interface PlatformRoadmap {
  platform: Platform;
  label: string;
  milestones: Milestone[];
}

export function filterTodos(
  items: TodoItem[],
  platform: Platform | "all",
  phase: Phase | "all",
  status: Status | "all",
): TodoItem[] {
  return items.filter(
    (item) =>
      (platform === "all" || item.platform === platform) &&
      (phase === "all" || item.phase === phase) &&
      (status === "all" || item.status === status),
  );
}

export interface RoadmapSummary {
  total: number;
  open: number;
  done: number;
  p1Open: number;
}

export function summarizeRoadmap(platforms: PlatformRoadmap[]): RoadmapSummary {
  const all = platforms.flatMap((p) => p.milestones);
  return {
    total: all.length,
    done: all.filter((m) => m.status === "done").length,
    open: all.filter((m) => m.status !== "done").length,
    p1Open: all.filter((m) => m.phase === "P1" && m.status !== "done").length,
  };
}
