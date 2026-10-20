import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vocalutor.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/companions", "/subscription"],
        disallow: [
          "/dashboard",
          "/my-journey",
          "/companions/new",
          "/sessions/",
          "/sentry-example-page",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
