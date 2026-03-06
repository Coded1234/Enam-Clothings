import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Newsletter from "../../client/src/pages/customer/Newsletter";

export const metadata = {
  title: "Newsletter - The Fashion Gallery",
  description: "Subscribe to The Fashion Gallery newsletter for the latest trends and exclusive offers.",
};

export default function NewsletterPage() {
  return (
    <CustomerLayout>
      <Newsletter />
    </CustomerLayout>
  );
}
