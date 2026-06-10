export type FeedItem = {
  type: "signup" | "tag" | "list";
  label: string;
  detail?: string;
  createdAt: string;
};

export function mergeFeed(items: FeedItem[], limit = 10): FeedItem[] {
  return items
    .filter((i) => !Number.isNaN(new Date(i.createdAt).getTime()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
