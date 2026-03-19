import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Cart from "../../client/src/pages/customer/Cart";

export const metadata = {
  title: "Shopping Cart",
  description:
    "Review and manage the items in your shopping cart at Diamond Aura Gallery.",
};

export default function CartPage() {
  return (
    <CustomerLayout>
      <Cart />
    </CustomerLayout>
  );
}
