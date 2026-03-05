import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../../client/src/components/ProtectedRoute";
import PaymentVerify from "../../../client/src/pages/customer/PaymentVerify";

export const metadata = {
  title: "Payment Verification - The Fashion Gallery",
  description: "Verifying your payment at The Fashion Gallery.",
};

export default function PaymentVerifyPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Suspense><PaymentVerify /></Suspense>
      </ProtectedRoute>
    </CustomerLayout>
  );
}
