import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listLists, listTastemakers } from "@/lib/api/index";
import type { CuratedList, Tastemaker } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Curated Lists — Tastemakers",
  description:
    "Browse restaurant lists curated by NYC's most trusted food tastemakers. Every spot is personal and intentional.",
  alternates: { canonical: "https://app.tastemakersapp.com/lists" },
};

export default async function ListsPage() {
  const [lists, tastemakers] = await Promise.all([listLists(), listTastemakers()]);

  // Build a slug → tastemaker map
  const listCurator = new Map<string, Tastemaker>();
  for (const t of tastemakers) {
    for (const l of t.lists) {
      listCurator.set(l.slug, t);
    }
  }

  return (
    <>
      <section
        style={{
          background: "linear-gradient(180deg, #3D296E 0%, #1A1038 100%)",
          padding: "72px 24px 64px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          Curated Lists
        </h1>
        <p style={{ fontSize: 18, color: "#B7ADCF", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Every list is a point of view. Eat accordingly.
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {lists.map((list, i) => (
            <ListCard key={list.id} list={list} curator={listCurator.get(list.slug) ?? null} priority={i < 2} />
          ))}
        </div>
      </section>
    </>
  );
}

function ListCard({
  list,
  curator,
  priority = false,
}: {
  list: CuratedList;
  curator: Tastemaker | null;
  priority?: boolean;
}) {
  return (
    <Link href={`/lists/${list.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        className="pub-card"
        style={{
          background: "#2A1A60",
          borderRadius: 16,
          border: "1px solid #3D2E6E",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", height: 200 }}>
          <Image
            src={list.coverImageUrl}
            alt={list.title}
            fill
            priority={priority}
            sizes="(max-width: 1100px) 50vw, 370px"
            style={{ objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(219,22,87,0.9)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
            }}
          >
            {list.restaurantCount} spots
          </span>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            {list.title}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#8b81a3",
              lineHeight: 1.5,
              margin: "0 0 16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {list.description}
          </p>
          {curator && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src={curator.avatarUrl}
                alt={curator.name}
                width={22}
                height={22}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <span style={{ fontSize: 12, color: "#8b81a3" }}>{curator.name}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
