"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import CustomerLayout from "../../client/src/layouts/CustomerLayout";
import DataDeletionStatus from "../../client/src/pages/customer/DataDeletionStatus";

export default function DataDeletionStatusPage() {
  return (
    <CustomerLayout>
      <Suspense><DataDeletionStatus /></Suspense>
    </CustomerLayout>
  );
}
