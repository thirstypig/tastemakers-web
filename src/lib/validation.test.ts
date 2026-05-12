import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, validateRequired } from "./validation";

// ── validateEmail ─────────────────────────────────────────────────────────────

describe("validateEmail", () => {
  it("returns null for a valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("returns null for a valid subdomain email", () => {
    expect(validateEmail("user@mail.example.com")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  it("returns error for whitespace-only string", () => {
    expect(validateEmail("   ")).toBe("Email is required");
  });

  it("returns error for missing @", () => {
    expect(validateEmail("notanemail")).toBe("Invalid email address");
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("user@")).toBe("Invalid email address");
  });

  it("returns error for missing local part", () => {
    expect(validateEmail("@example.com")).toBe("Invalid email address");
  });

  it("returns error for spaces inside email", () => {
    expect(validateEmail("user @example.com")).toBe("Invalid email address");
  });
});

// ── validatePassword ──────────────────────────────────────────────────────────

describe("validatePassword", () => {
  it("returns null for a valid password (8+ chars)", () => {
    expect(validatePassword("securepass")).toBeNull();
  });

  it("returns null for exactly 8 characters", () => {
    expect(validatePassword("12345678")).toBeNull();
  });

  it("returns error for empty password", () => {
    expect(validatePassword("")).toBe("Password is required");
  });

  it("returns error for password shorter than 8 characters", () => {
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
  });

  it("returns error for 7-character password (boundary)", () => {
    expect(validatePassword("1234567")).toBe("Password must be at least 8 characters");
  });
});

// ── validateRequired ──────────────────────────────────────────────────────────

describe("validateRequired", () => {
  it("returns null when value is present", () => {
    expect(validateRequired("John", "Name")).toBeNull();
  });

  it("returns '<field> is required' for empty string", () => {
    expect(validateRequired("", "Name")).toBe("Name is required");
  });

  it("returns error for whitespace-only value", () => {
    expect(validateRequired("   ", "Username")).toBe("Username is required");
  });

  it("uses the field name in the error message", () => {
    expect(validateRequired("", "Phone number")).toBe("Phone number is required");
  });
});
