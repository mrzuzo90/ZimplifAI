import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/redes-bt-uf0894", "/redes-bt-uf0894/", "/api/redes-bt-uf0894"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
