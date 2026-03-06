import { Suspense } from "react";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import VerifyEmail from "../../client/src/pages/customer/VerifyEmail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verify Email",
  description: "Verify your email address for your Diamond Vogue Gallery account.",
};

export default function VerifyEmailPage() {
  return (
    <CustomerLayout>
      <Suspense><VerifyEmail /></Suspense>
    </CustomerLayout>
  );
}
