export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://the-fashion-gallery.vercel.app");

  const staticRoutes = [
    "",
    "/shop",
    "/shop/women",
    "/shop/men",
    "/shop/accessories",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
    "/cookies",
    "/size-guide",
    "/login",
    "/register",
    "/forgot-password",
    "/search",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  let productRoutes = [];
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api`
        : "http://localhost:5000/api");

    let page = 1;
    const pageSize = 100;
    let allProducts = [];
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${apiUrl}/products?limit=${pageSize}&page=${page}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const data = await res.json();
      const products = data.products || data;
      if (!Array.isArray(products) || products.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(products);
        hasMore = products.length === pageSize;
        page++;
      }
    }

    productRoutes = allProducts.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updatedAt || product.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch {
    // Return only static routes if products fetch fails
  }

  return [...staticRoutes, ...productRoutes];
}
