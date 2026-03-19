import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../../client/src/components/ProtectedRoute";
import OrderDetail from "../../../client/src/pages/customer/OrderDetail";

export const metadata = {
  title: "Order Details",
  description: "View order details at Diamond Aura Gallery.",
};

export default function OrderDetailPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <OrderDetail />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
