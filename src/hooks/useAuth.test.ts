// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./useAuth";

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  }),
}));

const MOCK_USER = { id: "user-1", email: "owner@example.com" };

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it("starts with loading=true and user=null before session resolves", () => {
    // getSession never resolves in this test — hook stays in loading state
    mockGetSession.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  // ── session resolution ────────────────────────────────────────────────────

  it("sets user and clears loading once getSession resolves with a session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: MOCK_USER } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(MOCK_USER);
  });

  it("sets user=null and loading=false when there is no active session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  // ── auth state changes ────────────────────────────────────────────────────

  it("updates user when onAuthStateChange fires a SIGNED_IN event", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.user).toBeNull();

    await act(async () => {
      capturedCallback!("SIGNED_IN", { user: MOCK_USER });
    });

    expect(result.current.user).toEqual(MOCK_USER);
  });

  it("clears user when onAuthStateChange fires a SIGNED_OUT event", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: MOCK_USER } },
      error: null,
    });

    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.user).toEqual(MOCK_USER);

    await act(async () => {
      capturedCallback!("SIGNED_OUT", null);
    });

    expect(result.current.user).toBeNull();
  });

  // ── signOut ───────────────────────────────────────────────────────────────

  it("calls supabase.auth.signOut() when signOut() is invoked", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  it("unsubscribes from auth state changes on unmount", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const { unmount } = renderHook(() => useAuth());
    await act(async () => {});

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
