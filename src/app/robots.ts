import type { MetadataRoute } from "next";
import { canonical } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /v2/api is the legacy iOS shim (next.config.ts). It forwards the
        // entire Laravel API surface — including the unauthenticated read
        // endpoints — onto this domain, so without this line the whole thing
        // is crawlable under the primary SEO host. "/api" does not cover it:
        // robots paths match from the root, not as a substring.
        disallow: ["/admin", "/api", "/v2/api"],
      },
    ],
    sitemap: canonical("/sitemap.xml"),
  };
}
