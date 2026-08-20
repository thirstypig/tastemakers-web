// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RankedTagCloud from "./RankedTagCloud";

// ── Boundaries ────────────────────────────────────────────────────────────────

const mockUser = vi.fn();
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser(), loading: false, session: null, signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/restaurants/langer-s-159",
}));

const TAGS = [
  { id: "1", name: "Would Recommend", count: 9 },
  { id: "2", name: "Great Service", count: 8 },
  { id: "3", name: "Long Wait", count: 5 },
];

function chip(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name},`) });
}

beforeEach(() => {
  mockUser.mockReturnValue({ id: "u1", email: "a@b.com" });
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  // vitest does not run with globals, so Testing Library's automatic cleanup
  // is never registered — without this the DOM accumulates across tests and
  // every query fails with "found multiple elements".
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("RankedTagCloud", () => {
  it("orders tags strongest first regardless of input order", () => {
    render(
      <RankedTagCloud
        restaurantId="159"
        tags={[
          { id: "3", name: "Long Wait", count: 5 },
          { id: "1", name: "Would Recommend", count: 9 },
        ]}
      />,
    );
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels[0]).toBe("Would Recommend");
  });

  it("announces each tag's strength, so the ramp is not the only signal", () => {
    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    // Leader is 9; Long Wait has 5, a 0.56 share → L3.
    expect(screen.getByRole("button", { name: /Long Wait, strength 3 of 5/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Would Recommend, strength 1 of 5/ })).toBeTruthy();
  });

  it("shows tags but not the vote action when signed out", () => {
    mockUser.mockReturnValue(null);
    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);

    // Content is never hidden from anonymous visitors — only the action is.
    expect(screen.getByText("Would Recommend")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Would Recommend,/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Sign in to vote/ })).toBeTruthy();
  });

  it("adds a vote optimistically before the request resolves", async () => {
    let release!: (v: unknown) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((r) => { release = r; }) as never);

    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    await userEvent.click(chip("Long Wait"));

    // Reflected immediately, with the request still in flight.
    expect(chip("Long Wait").getAttribute("aria-pressed")).toBe("true");

    release({ ok: true, json: async () => ({ ok: true }) });
  });

  it("rolls the vote back when the server refuses it", async () => {
    // Production returns 409 vote_blocked when another user already applied
    // this tag here (todo 067). Without rollback the chip stays lit and the
    // reader believes a vote was recorded that the database dropped.
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Someone already tagged this place with that tag.", code: "vote_blocked" }),
    } as never);

    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    await userEvent.click(chip("Long Wait"));

    await waitFor(() => {
      expect(chip("Long Wait").getAttribute("aria-pressed")).toBe("false");
    });
    expect(screen.getByText(/Someone already tagged this place/)).toBeTruthy();
  });

  it("rolls back on a network failure too", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));

    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    await userEvent.click(chip("Great Service"));

    await waitFor(() => {
      expect(chip("Great Service").getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("keeps the vote when the server accepts it", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as never);

    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    await userEvent.click(chip("Long Wait"));

    await waitFor(() => {
      expect(chip("Long Wait").getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("DELETEs when removing a vote you already cast", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as never);

    render(
      <RankedTagCloud
        restaurantId="159"
        tags={[{ id: "1", name: "Would Recommend", count: 9, mine: true }]}
      />,
    );
    await userEvent.click(chip("Would Recommend"));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.lastCall?.[1]).toMatchObject({ method: "DELETE" });
    });
  });

  it("re-levels the cloud after a vote instead of leaving stale strengths", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as never);

    // Long Wait has 5 against a leader of 9 → 0.56 share → L3.
    // One vote moves it to 6 → 0.67 → L2.
    render(<RankedTagCloud restaurantId="159" tags={TAGS} />);
    await userEvent.click(chip("Long Wait"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Long Wait, strength 2 of 5/ })).toBeTruthy();
    });
  });

  it("shows an empty state rather than a bare card when there are no tags", () => {
    render(<RankedTagCloud restaurantId="159" tags={[]} />);
    expect(screen.getByText(/be the first to tag this place/i)).toBeTruthy();
  });

  it("hides everything past the first twelve until asked", async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      name: `Tag ${i + 1}`,
      count: 15 - i,
    }));
    render(<RankedTagCloud restaurantId="159" tags={many} />);

    expect(screen.getAllByRole("button", { name: /Tag \d+,/ })).toHaveLength(12);

    await userEvent.click(screen.getByRole("button", { name: /Show all \(15\)/ }));
    expect(screen.getAllByRole("button", { name: /Tag \d+,/ })).toHaveLength(15);
  });
});
