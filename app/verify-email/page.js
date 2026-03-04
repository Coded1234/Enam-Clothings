"use client";
import { Suspense } from "react";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import VerifyEmail from "../../client/src/pages/customer/VerifyEmail";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <CustomerLayout>
      <Suspense><VerifyEmail /></Suspense>
    </CustomerLayout>
  );
}
