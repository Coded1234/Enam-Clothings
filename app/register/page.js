import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Register from "../../client/src/pages/customer/Register";

export const metadata = {
  title: "Create Account - The Fashion Gallery",
  description: "Create a free account at The Fashion Gallery to start shopping premium fashion and clothing.",
};

export default function RegisterPage() {
  return (
    <CustomerLayout>
      <Suspense><Register /></Suspense>
    </CustomerLayout>
  );
}
