"use client";
import AdminRoute from "../../client/src/components/AdminRoute";
import AdminLayout from "../../client/src/layouts/AdminLayout";

export default function AdminLayoutWrapper({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRoute>
  );
}
