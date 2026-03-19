import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ResendVerification from "../../client/src/pages/customer/ResendVerification";

export const metadata = {
  title: "Resend Verification Email",
  description: "Resend your email verification link for Diamond Aura Gallery.",
};

export default function ResendVerificationPage() {
  return (
    <CustomerLayout>
      <ResendVerification />
    </CustomerLayout>
  );
}
