"use client";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Orders from "../../client/src/pages/customer/Orders";

export default function OrdersPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Orders />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
