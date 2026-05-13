import type { Tag } from "@/lib/api/types";
import TagChip from "./TagChip";

interface Props {
  tags: Tag[];
  showCount?: boolean;
  className?: string;
}

export default function TagCloud({ tags, showCount = false, className = "" }: Props) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} showCount={showCount} />
      ))}
    </div>
  );
}
