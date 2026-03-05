import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import DataDeletionStatus from "../../client/src/pages/customer/DataDeletionStatus";

export const metadata = {
  title: "Data Deletion Status - The Fashion Gallery",
  description: "Check the status of your data deletion request at The Fashion Gallery.",
};

export default function DataDeletionStatusPage() {
  return (
    <CustomerLayout>
      <Suspense><DataDeletionStatus /></Suspense>
    </CustomerLayout>
  );
}
