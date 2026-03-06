import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Cart from "../../client/src/pages/customer/Cart";

export const metadata = {
  title: "Shopping Cart - The Fashion Gallery",
  description: "Review and manage the items in your shopping cart at The Fashion Gallery.",
};

export default function CartPage() {
  return (
    <CustomerLayout>
      <Cart />
    </CustomerLayout>
  );
}
