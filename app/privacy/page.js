import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import PrivacyPolicy from "../../client/src/pages/customer/PrivacyPolicy";

export const metadata = {
  title: "Privacy Policy - The Fashion Gallery",
  description:
    "Read the Privacy Policy of The Fashion Gallery to learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <CustomerLayout>
      <PrivacyPolicy />
    </CustomerLayout>
  );
}
