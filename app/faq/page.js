import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import FAQ from "../../client/src/pages/customer/FAQ";

export const metadata = {
  title: "FAQ - The Fashion Gallery",
  description:
    "Frequently asked questions about shopping, shipping, returns, and more at The Fashion Gallery.",
};

export default function FAQPage() {
  return (
    <CustomerLayout>
      <FAQ />
    </CustomerLayout>
  );
}
