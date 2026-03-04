"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Contact from "../../client/src/pages/customer/Contact";

export default function ContactPage() {
  return (
    <CustomerLayout>
      <Suspense><Contact /></Suspense>
    </CustomerLayout>
  );
}
