import CustomerLayout from "../../../client/src/layouts/CustomerLayout";
import ResetPassword from "../../../client/src/pages/customer/ResetPassword";

export const metadata = {
  title: "Reset Password",
  description: "Reset your Diamond Aura Gallery account password.",
};

export default function ResetPasswordPage() {
  return (
    <CustomerLayout>
      <ResetPassword />
    </CustomerLayout>
  );
}
