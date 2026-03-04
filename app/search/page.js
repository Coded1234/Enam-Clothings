"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import SearchResults from "../../client/src/pages/customer/SearchResults";

export default function SearchPage() {
  return (
    <CustomerLayout>
      <Suspense><SearchResults /></Suspense>
    </CustomerLayout>
  );
}
