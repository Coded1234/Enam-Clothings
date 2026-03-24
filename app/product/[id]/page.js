import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ProductDetail from "../../../client/src/pages/customer/ProductDetail";

function getApiUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api`
      : "http://localhost:5000/api")
  );
}

/** Extract a plain string URL from an image that may be a string or {url, public_id} object */
function extractImageUrl(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (img.url) return img.url;
  return null;
}

/** Ensure data crossing the server→client boundary is plain JSON (no Sequelize decorations) */
function toPlain(data) {
  if (data == null) return data;
  return JSON.parse(JSON.stringify(data));
}

async function getProduct(id) {
  try {
    const res = await fetch(`${getApiUrl()}/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function getRelatedProducts(id) {
  try {
    const res = await fetch(`${getApiUrl()}/products/${id}/related`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

async function getReviews(productId) {
  try {
    const res = await fetch(
      `${getApiUrl()}/reviews/product/${productId}?limit=10&sort=newest`,
      { next: { revalidate: 60 } },
    );
    if (res.ok) return await res.json();
  } catch {}
  return { reviews: [], total: 0, ratingDistribution: [] };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (product) {
    const name = product.name || "Product";
    const desc = product.description
      ? product.description.slice(0, 160)
      : `Shop ${name} at Diamond Aura Gallery.`;
    const imageUrl = extractImageUrl(product.images?.[0]);
    return {
      title: name,
      description: desc,
      openGraph: {
        title: `${name} - Diamond Aura Gallery`,
        description: desc,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: "website",
      },
    };
  }

  return {
    title: "Product",
    description: "Shop premium fashion and clothing at Diamond Aura Gallery.",
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  const [product, relatedProducts, reviewsData] = await Promise.all([
    getProduct(id),
    getRelatedProducts(id),
    getReviews(id),
  ]);

  // Construct SEO JSON-LD schema
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.images
          ? product.images.map((img) => extractImageUrl(img)).filter(Boolean)
          : [],
        description: product.description,
        sku: product.id,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD", // Update to store currency if dynamic
          price: product.price,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        // Optional: add AggregateRating if we have reviews
        ...(reviewsData?.total > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating || 5, // fallback if needed
            reviewCount: reviewsData.total,
          },
        }),
      }
    : null;

  return (
    <CustomerLayout>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail
        initialProduct={toPlain(product)}
        initialRelatedProducts={toPlain(relatedProducts)}
        initialReviews={toPlain(reviewsData?.reviews || [])}
        initialReviewsMeta={toPlain({
          total: reviewsData?.total || 0,
          ratingDistribution: reviewsData?.ratingDistribution || [],
        })}
      />
    </CustomerLayout>
  );
}
