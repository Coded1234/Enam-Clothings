import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import CookiePolicy from "../../client/src/pages/customer/CookiePolicy";

export const metadata = {
  title: "Cookie Policy - The Fashion Gallery",
  description:
    "Read the Cookie Policy of The Fashion Gallery. Learn how we use cookies to improve your shopping experience.",
};

export default function CookiePolicyPage() {
  return (
    <CustomerLayout>
      <CookiePolicy />
    </CustomerLayout>
  );
}
