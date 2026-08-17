import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { restaurantImageUrl } from "./api";

const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

describe("restaurantImageUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tastemakersapp.com/api";
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = ORIGINAL;
  });

  it("resolves a bare filename against the API host, not the web host", () => {
    // restaurant_images.image stores only a hashed filename.
    expect(restaurantImageUrl("abc123.jpg")).toBe(
      "https://api.tastemakersapp.com/storage/res_image/abc123.jpg",
    );
  });

  it("strips the /api suffix rather than nesting it in the path", () => {
    expect(restaurantImageUrl("x.png")).not.toContain("/api/storage");
  });

  it("tolerates an API base without a trailing /api", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tastemakersapp.com";
    expect(restaurantImageUrl("x.png")).toBe(
      "https://api.tastemakersapp.com/storage/res_image/x.png",
    );
  });

  it("tolerates a trailing slash on the API base", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tastemakersapp.com/api/";
    expect(restaurantImageUrl("x.png")).toBe(
      "https://api.tastemakersapp.com/storage/res_image/x.png",
    );
  });

  it("does not double up slashes when the filename has a leading one", () => {
    expect(restaurantImageUrl("/x.png")).toBe(
      "https://api.tastemakersapp.com/storage/res_image/x.png",
    );
  });

  it("passes an already-absolute URL through untouched", () => {
    const absolute = "https://cdn.example.com/photos/x.jpg";
    expect(restaurantImageUrl(absolute)).toBe(absolute);
    expect(restaurantImageUrl("http://example.com/y.jpg")).toBe("http://example.com/y.jpg");
  });

  it("falls back to the production host when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(restaurantImageUrl("x.png")).toBe(
      "https://api.tastemakersapp.com/storage/res_image/x.png",
    );
  });
});
