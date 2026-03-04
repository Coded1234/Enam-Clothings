"use client";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Checkout from "../../client/src/pages/customer/Checkout";

export default function CheckoutPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Checkout />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
