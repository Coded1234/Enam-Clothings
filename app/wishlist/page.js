"use client";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Wishlist from "../../client/src/pages/customer/Wishlist";

export default function WishlistPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Wishlist />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
