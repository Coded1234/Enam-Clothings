import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ForgotPassword from "../../client/src/pages/customer/ForgotPassword";

export const metadata = {
  title: "Forgot Password - The Fashion Gallery",
  description: "Reset your The Fashion Gallery account password.",
};

export default function ForgotPasswordPage() {
  return (
    <CustomerLayout>
      <ForgotPassword />
    </CustomerLayout>
  );
}
