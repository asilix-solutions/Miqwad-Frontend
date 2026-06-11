/**
 * @file AdminLayout.tsx
 * @description Full-page desktop dashboard shell for Admin routes.
 */

import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-app-bg,#F5F6FA)] flex">
      <AdminSidebar />
      <div className="flex flex-col min-h-screen w-full ms-[260px]">
        <div className="sticky top-0 z-30">
          <AdminTopbar />
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
