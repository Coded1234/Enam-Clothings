import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import TermsOfService from "../../client/src/pages/customer/TermsOfService";

export const metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for Diamond Aura Gallery. Learn about our policies, user agreements, and usage guidelines.",
};

export default function TermsOfServicePage() {
  return (
    <CustomerLayout>
      <TermsOfService />
    </CustomerLayout>
  );
}
