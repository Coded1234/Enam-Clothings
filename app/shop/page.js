import { Suspense } from "react";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Shop from "../../client/src/pages/customer/Shop";

export const metadata = {
  title: "Shop",
  description: "Browse our full collection of premium fashion and clothing.",
};

export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <CustomerLayout>
      <Suspense><Shop /></Suspense>
    </CustomerLayout>
  );
}
