import Image from "next/image";
import Link from "next/link";
import "./list-card.css";

/**
 * The list/cuisine tile. Owns its stylesheet so any consumer gets the styles
 * by importing the component — home, lists, cuisines and bookmarks all use it,
 * and a forgotten `import "./list-card.css"` would silently break the layout.
 */
export default function ListCard({
  href,
  title,
  meta,
  imageUrl,
}: {
  href: string;
  title: string;
  meta: string;
  imageUrl: string;
}) {
  return (
    <Link href={href} className="tm-listcard">
      <span className="tm-listcard-photo">
        <Image src={imageUrl} alt="" fill sizes="300px" style={{ objectFit: "cover" }} />
      </span>
      <span className="tm-listcard-body">
        <span className="tm-listcard-title">{title}</span>
        <span className="tm-listcard-meta">{meta}</span>
      </span>
    </Link>
  );
}
