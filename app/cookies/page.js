import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import CookiePolicy from "../../client/src/pages/customer/CookiePolicy";

export const metadata = {
  title: "Cookie Policy",
  description:
    "Read the Cookie Policy of Diamond Aura Gallery. Learn how we use cookies to improve your shopping experience.",
};

export default function CookiePolicyPage() {
  return (
    <CustomerLayout>
      <CookiePolicy />
    </CustomerLayout>
  );
}
