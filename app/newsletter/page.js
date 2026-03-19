import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Newsletter from "../../client/src/pages/customer/Newsletter";

export const metadata = {
  title: "Newsletter",
  description:
    "Subscribe to Diamond Aura Gallery newsletter for the latest trends and exclusive offers.",
};

export default function NewsletterPage() {
  return (
    <CustomerLayout>
      <Newsletter />
    </CustomerLayout>
  );
}
