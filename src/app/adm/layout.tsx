"use client";

import { ViewAsProvider } from "../../../hooks/useViewAs";
import ViewAsStatus from "../../../components/adm/ViewAsStatus";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewAsProvider>
      <div className="admin-layout">
        <ViewAsStatus />
        {children}
      </div>
    </ViewAsProvider>
  );
} 