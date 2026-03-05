export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://the-fashion-gallery.vercel.app");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/orders", "/profile", "/payment"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
