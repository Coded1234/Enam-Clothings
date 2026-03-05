import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ResendVerification from "../../client/src/pages/customer/ResendVerification";

export const metadata = {
  title: "Resend Verification Email - The Fashion Gallery",
  description: "Resend your email verification link for The Fashion Gallery.",
};

export default function ResendVerificationPage() {
  return (
    <CustomerLayout>
      <ResendVerification />
    </CustomerLayout>
  );
}
