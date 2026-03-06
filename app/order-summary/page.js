import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import OrderSummary from "../../client/src/pages/customer/OrderSummary";

export const metadata = {
  title: "Order Summary",
  description: "View your order summary at Diamond Vogue Gallery.",
};

export default function OrderSummaryPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <OrderSummary />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
