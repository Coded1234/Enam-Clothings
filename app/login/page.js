"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Login from "../../client/src/pages/customer/Login";

export default function LoginPage() {
  return (
    <CustomerLayout>
      <Suspense><Login /></Suspense>
    </CustomerLayout>
  );
}
