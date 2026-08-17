import { NextResponse } from "next/server";
import {
  isPlausibleEmail,
  mapSubscribeResponse,
  subscribeBody,
  subscribeUrl,
} from "@/features/email/subscribe";

/**
 * POST /api/subscribe — add an address to the beehiiv publication.
 *
 * The API key lives only here. It can read and write the entire subscriber
 * list, so it must never be exposed to the browser (no NEXT_PUBLIC_ prefix)
 * and no upstream error text is forwarded verbatim to the client.
 */
export async function POST(req: Request) {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    console.error("[subscribe] BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID not set");
    return NextResponse.json(
      { error: "Sign-up is temporarily unavailable." },
      { status: 503 },
    );
  }

  let email = "";
  let source = "tastemakersapp.com";
  try {
    const body = (await req.json()) as { email?: string; source?: string };
    email = String(body.email ?? "");
    if (body.source) source = String(body.source).slice(0, 60);
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const res = await fetch(subscribeUrl(publicationId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscribeBody(email, source)),
    });

    const payload = await res.json().catch(() => ({}));
    const outcome = mapSubscribeResponse(res.status, payload);

    if (!outcome.ok) {
      // Log the upstream detail server-side; return only the safe message.
      console.error("[subscribe] beehiiv %d %s", res.status, JSON.stringify(payload).slice(0, 300));
      return NextResponse.json(
        { error: outcome.message },
        { status: outcome.code === "invalid" ? 400 : 502 },
      );
    }

    return NextResponse.json({ ok: true, status: outcome.status });
  } catch (err) {
    console.error("[subscribe] network error", err);
    return NextResponse.json({ error: "Could not sign you up just now." }, { status: 502 });
  }
}
