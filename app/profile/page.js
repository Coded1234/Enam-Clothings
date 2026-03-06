import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Profile from "../../client/src/pages/customer/Profile";

export const metadata = {
  title: "My Profile",
  description: "Manage your profile and account settings at Diamond Vogue Gallery.",
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
