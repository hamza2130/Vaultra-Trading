import type { MetadataRoute } from "next";

// Internal tool — ask crawlers to stay away entirely.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
