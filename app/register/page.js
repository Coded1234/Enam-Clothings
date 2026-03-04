"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Register from "../../client/src/pages/customer/Register";

export default function RegisterPage() {
  return (
    <CustomerLayout>
      <Suspense><Register /></Suspense>
    </CustomerLayout>
  );
}
