import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import SizeGuide from "../../client/src/pages/customer/SizeGuide";

export const metadata = {
  title: "Size Guide - The Fashion Gallery",
  description:
    "Find your perfect fit with our comprehensive size guide at The Fashion Gallery.",
};

export default function SizeGuidePage() {
  return (
    <CustomerLayout>
      <SizeGuide />
    </CustomerLayout>
  );
}
