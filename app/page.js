import CustomerLayout from "../client/src/layouts/CustomerLayout";
import Home from "../client/src/pages/customer/Home";

export const metadata = {
  title: "The Fashion Gallery - Premium Fashion & Clothing",
  description: "Shop premium fashion and clothing at The Fashion Gallery.",
};

export default function HomePage() {
  return (
    <CustomerLayout>
      <Home />
    </CustomerLayout>
  );
}
