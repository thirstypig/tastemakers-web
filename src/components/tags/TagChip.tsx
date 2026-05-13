import type { Tag } from "@/lib/api/types";
import { TAG_LEVEL_STYLES } from "./tag-utils";

interface Props {
  tag: Tag;
  showCount?: boolean;
}

export default function TagChip({ tag, showCount = false }: Props) {
  const { bg, text } = TAG_LEVEL_STYLES[tag.level] ?? TAG_LEVEL_STYLES[5];

  return (
    <span
      className="inline-block rounded px-2 py-1 text-xs font-medium leading-none"
      style={{ backgroundColor: bg, color: text }}
    >
      {tag.name}
      {showCount && tag.count && tag.count > 1 ? (
        <span className="ml-1 opacity-60">×{tag.count}</span>
      ) : null}
    </span>
  );
}
