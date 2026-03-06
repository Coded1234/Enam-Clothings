import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Checkout from "../../client/src/pages/customer/Checkout";

export const metadata = {
  title: "Checkout - The Fashion Gallery",
  description: "Complete your purchase at The Fashion Gallery.",
};

export default function CheckoutPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Checkout />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
