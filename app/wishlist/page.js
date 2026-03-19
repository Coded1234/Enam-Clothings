import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ProtectedRoute from "../../client/src/components/ProtectedRoute";
import Wishlist from "../../client/src/pages/customer/Wishlist";

export const metadata = {
  title: "My Wishlist",
  description:
    "View and manage your saved items on Diamond Aura Gallery wishlist.",
};

export default function WishlistPage() {
  return (
    <CustomerLayout>
      <ProtectedRoute>
        <Wishlist />
      </ProtectedRoute>
    </CustomerLayout>
  );
}
