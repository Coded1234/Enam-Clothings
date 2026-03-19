import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import SearchResults from "../../client/src/pages/customer/SearchResults";

export const metadata = {
  title: "Search",
  description:
    "Search for premium fashion and clothing at Diamond Aura Gallery.",
};

export default function SearchPage() {
  return (
    <CustomerLayout>
      <Suspense>
        <SearchResults />
      </Suspense>
    </CustomerLayout>
  );
}
