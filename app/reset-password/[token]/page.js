import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ResetPassword from "../../../client/src/pages/customer/ResetPassword";

export const metadata = {
  title: "Reset Password - The Fashion Gallery",
  description: "Reset your The Fashion Gallery account password.",
};

export default function ResetPasswordPage() {
  return (
    <CustomerLayout>
      <ResetPassword />
    </CustomerLayout>
  );
}
