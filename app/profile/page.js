"use client";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Profile from "../../client/src/pages/customer/Profile";

export default function ProfilePage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
