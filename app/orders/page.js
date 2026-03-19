import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Orders from "../../client/src/pages/customer/Orders";

export const metadata = {
  title: "My Orders",
  description: "View and track your orders at Diamond Aura Gallery.",
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
