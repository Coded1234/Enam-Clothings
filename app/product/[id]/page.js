import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ProductDetail from "../../../client/src/pages/customer/ProductDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api`
        : "http://localhost:5000/api");
    const res = await fetch(`${apiUrl}/products/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const product = data.product || data;
      return {
        title: `${product.name} - The Fashion Gallery`,
        description: product.description
          ? product.description.slice(0, 160)
          : `Shop ${product.name} at The Fashion Gallery.`,
        openGraph: {
          title: `${product.name} - The Fashion Gallery`,
          description: product.description
            ? product.description.slice(0, 160)
            : `Shop ${product.name} at The Fashion Gallery.`,
          images:
            product.images && product.images.length > 0
              ? [{ url: product.images[0] }]
              : [],
          type: "website",
        },
      };
    }
  } catch {
    // fall through to default
  }
  return {
    title: "Product - The Fashion Gallery",
    description: "Shop premium fashion and clothing at The Fashion Gallery.",
  };
}

export default function ProductDetailPage() {
  return (
    <CustomerLayout>
      <ProductDetail />
    </CustomerLayout>
  );
}
