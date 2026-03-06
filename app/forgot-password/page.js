import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import ForgotPassword from "../../client/src/pages/customer/ForgotPassword";

export const metadata = {
  title: "Forgot Password",
  description: "Reset your Diamond Vogue Gallery account password.",
};

export default function ForgotPasswordPage() {
  return (
    <CustomerLayout>
      <ForgotPassword />
    </CustomerLayout>
  );
}
