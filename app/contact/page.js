import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import Contact from "../../client/src/pages/customer/Contact";

export const metadata = {
  title: "Contact Us - The Fashion Gallery",
  description:
    "Get in touch with The Fashion Gallery. We're here to help with any questions about our products and services.",
};

export default function ContactPage() {
  return (
    <CustomerLayout>
      <Suspense><Contact /></Suspense>
    </CustomerLayout>
  );
}
