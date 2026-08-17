import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./pg-errors";

describe("isUniqueViolation", () => {
  it("matches the exact message production emits", () => {
    // Verified against Supabase in a rolled-back transaction:
    // INSERT on an existing (restaurant_id, tag_id) pair.
    expect(
      isUniqueViolation(
        'duplicate key value violates unique constraint "restaurant_tag_restaurant_tag_unique"',
      ),
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(
      isUniqueViolation('DUPLICATE KEY VALUE VIOLATES UNIQUE CONSTRAINT "x"'),
    ).toBe(true);
  });

  it("does not match unrelated errors that merely contain 'duplicate'", () => {
    // The bug in the previous implementation: a bare .includes("duplicate")
    // swallowed anything with the word in it.
    expect(isUniqueViolation("could not create duplicate index concurrently")).toBe(false);
    expect(isUniqueViolation("duplicate")).toBe(false);
  });

  it("does not match other constraint failures", () => {
    expect(
      isUniqueViolation(
        'insert or update on table "restaurant_tag" violates foreign key constraint "fk_tag"',
      ),
    ).toBe(false);
    expect(isUniqueViolation('null value in column "user_id" violates not-null constraint')).toBe(
      false,
    );
  });

  it("does not match an empty message", () => {
    expect(isUniqueViolation("")).toBe(false);
  });
});
