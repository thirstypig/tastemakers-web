"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import RankedTagChip from "@/features/tags/RankedTagChip";
import type { TagLevel } from "@/features/tags/levels";

const APP_STORE = "https://apps.apple.com/app/id1573533249";

/** A worked example of the mechanic — the strongest tags are the most-agreed. */
const DEMO: Array<{ label: string; level: TagLevel }> = [
  { label: "worth the wait", level: 1 },
  { label: "tiny room", level: 2 },
  { label: "cash only", level: 3 },
  { label: "good for a date", level: 4 },
  { label: "street parking only", level: 5 },
];

const STEPS = [
  { n: "01", title: "Find the place", body: "Search any city. Restaurant pages are open to read — no account needed." },
  { n: "02", title: "Tag it", body: "A few words beat a star rating. Reuse someone else's tag and it counts as a vote." },
  { n: "03", title: "The best tags rise", body: "The more people agree, the stronger a tag looks. No stars, no averages." },
];

/**
 * The signed-out introduction: what it is, how it works, and where to get the
 * app. Removes itself entirely once signed in — screen 6 is screen 5 minus
 * this — so the page stays thin for people who already know the product.
 */
export default function PitchBand() {
  const { user } = useAuth();

  // Renders while auth is still resolving, on purpose. Hiding during `loading`
  // meant the server emitted nothing, so the homepage reached crawlers with no
  // <h1> and no value proposition. A signed-in visitor sees it for one frame;
  // an unauthenticated crawler seeing an empty homepage is the worse trade.
  if (user) return null;

  return (
    <>
      <section className="tm-card tm-pitch">
        <h1 className="tm-pitch-title">Every review is a tag. Every tag is a vote.</h1>
        <p className="tm-pitch-body">
          Five stars never told you the room was loud or the wait was two hours.
          Here, people tag what actually mattered — and the tags everyone agrees
          on rise to the top.
        </p>

        <div className="tm-pitch-demo" aria-label="Example tags, strongest first">
          {DEMO.map((d) => (
            <RankedTagChip key={d.label} label={d.label} level={d.level} />
          ))}
        </div>

        <div className="tm-pitch-actions">
          <Link href="/signup" className="tm-btn tm-btn-primary">
            Create account
          </Link>
          <a
            href={APP_STORE}
            className="tm-btn tm-btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get the iPhone app
          </a>
        </div>
      </section>

      <section className="tm-steps">
        {STEPS.map((s) => (
          <div key={s.n} className="tm-card tm-step">
            <span className="tm-step-n">STEP {s.n}</span>
            <h2 className="tm-step-title">{s.title}</h2>
            <p className="tm-step-body">{s.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
