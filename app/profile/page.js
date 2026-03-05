import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Profile from "../../client/src/pages/customer/Profile";

export const metadata = {
  title: "My Profile - The Fashion Gallery",
  description: "Manage your profile and account settings at The Fashion Gallery.",
};

export default function ProfilePage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
