import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import SearchResults from "../../client/src/pages/customer/SearchResults";

export const metadata = {
  title: "Search - The Fashion Gallery",
  description: "Search for premium fashion and clothing at The Fashion Gallery.",
};

export default function SearchPage() {
  return (
    <CustomerLayout>
      <Suspense><SearchResults /></Suspense>
    </CustomerLayout>
  );
}
