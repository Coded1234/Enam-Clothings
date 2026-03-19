import CustomerLayout from "../../../../client/src/layouts/CustomerLayout";
import ProductReviews from "../../../../client/src/pages/customer/ProductReviews";

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
        title: `Reviews for ${product.name}`,

        description: `Read customer reviews for ${product.name} at Diamond Aura Gallery.`,
      };
    }
  } catch {
    // fall through to default
  }
  return {
    title: "Product Reviews",
    description: "Read customer reviews at Diamond Aura Gallery.",
  };
}

export default function ProductReviewsPage() {
  return (
    <CustomerLayout>
      <ProductReviews />
    </CustomerLayout>
  );
}
