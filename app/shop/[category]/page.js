import { Suspense } from "react";
import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import Shop from "../../../client/src/pages/customer/Shop";

export async function generateMetadata({ params }) {
  const category = params.category;
  return {
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} - The Fashion Gallery`,
    description: `Shop ${category} at The Fashion Gallery.`,
  };
}

export const dynamic = "force-dynamic";

export default function ShopCategoryPage() {
  return (
    <CustomerLayout>
      <Suspense><Shop /></Suspense>
    </CustomerLayout>
  );
}
