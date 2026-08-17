import { describe, expect, it } from "vitest";
import {
  isPlausibleEmail,
  mapSubscribeResponse,
  subscribeBody,
  subscribeUrl,
} from "./subscribe";

describe("isPlausibleEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isPlausibleEmail("james@tastemakersapp.com")).toBe(true);
    expect(isPlausibleEmail("a+tag@sub.domain.co.uk")).toBe(true);
  });

  it("trims before judging", () => {
    expect(isPlausibleEmail("  james@example.com  ")).toBe(true);
  });

  it("rejects the obviously broken", () => {
    expect(isPlausibleEmail("")).toBe(false);
    expect(isPlausibleEmail("no-at-sign")).toBe(false);
    expect(isPlausibleEmail("@example.com")).toBe(false);
    expect(isPlausibleEmail("two@@example.com")).toBe(false);
    expect(isPlausibleEmail("james@nodot")).toBe(false);
    expect(isPlausibleEmail("james@.com")).toBe(false);
    expect(isPlausibleEmail("james@example.")).toBe(false);
    expect(isPlausibleEmail("has space@example.com")).toBe(false);
  });

  it("rejects absurd lengths", () => {
    expect(isPlausibleEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});

describe("subscribeUrl", () => {
  it("targets the publication's subscriptions collection", () => {
    expect(subscribeUrl("pub_abc")).toBe(
      "https://api.beehiiv.com/v2/publications/pub_abc/subscriptions",
    );
  });
});

describe("subscribeBody", () => {
  it("trims the address and tags the source", () => {
    const body = subscribeBody("  a@b.com ", "home-footer");
    expect(body.email).toBe("a@b.com");
    expect(body.utm_source).toBe("home-footer");
  });

  it("never reactivates someone who unsubscribed", () => {
    // Resurrecting a deliberate unsubscribe is the one thing this must not do.
    expect(subscribeBody("a@b.com", "x").reactivate_existing).toBe(false);
  });

  it("asks for the welcome email, since the reader opted in", () => {
    expect(subscribeBody("a@b.com", "x").send_welcome_email).toBe(true);
  });
});

describe("mapSubscribeResponse", () => {
  it("treats 201 as a new subscription", () => {
    expect(mapSubscribeResponse(201, {})).toEqual({ ok: true, status: "subscribed" });
  });

  it("treats 200 as already subscribed, not an error", () => {
    expect(mapSubscribeResponse(200, {})).toEqual({ ok: true, status: "already" });
  });

  it("maps a 400 to a message about the address", () => {
    const out = mapSubscribeResponse(400, {});
    expect(out).toMatchObject({ ok: false, code: "invalid" });
  });

  it("never leaks a credential problem to the reader", () => {
    for (const status of [401, 403]) {
      const out = mapSubscribeResponse(status, { message: "invalid api key" });
      expect(out).toMatchObject({ ok: false, code: "config" });
      if (!out.ok) {
        expect(out.message.toLowerCase()).not.toContain("key");
        expect(out.message.toLowerCase()).not.toContain("api");
      }
    }
  });

  it("surfaces rate limiting as its own case", () => {
    expect(mapSubscribeResponse(429, {})).toMatchObject({ ok: false, code: "rate_limited" });
  });

  it("falls back to a generic message for unknown failures", () => {
    expect(mapSubscribeResponse(500, {})).toMatchObject({ ok: false, code: "upstream" });
  });
});
