import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Login from "../../client/src/pages/customer/Login";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Diamond Vogue Gallery account to access your orders, wishlist, and more.",
};

export default function LoginPage() {
  return (
    <CustomerLayout>
      <Suspense><Login /></Suspense>
    </CustomerLayout>
  );
}
