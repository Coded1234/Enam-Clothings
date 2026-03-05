import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Orders from "../../client/src/pages/customer/Orders";

export const metadata = {
  title: "My Orders - The Fashion Gallery",
  description: "View and track your orders at The Fashion Gallery.",
};

export default function OrdersPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Orders />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
