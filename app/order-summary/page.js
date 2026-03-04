"use client";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import OrderSummary from "../../client/src/pages/customer/OrderSummary";

export default function OrderSummaryPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <OrderSummary />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
