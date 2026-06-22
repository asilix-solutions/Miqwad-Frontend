/**
 * @file WorkshopLayout.tsx
 *
 * Responsive shell for the workshop provider area.
 * Desktop (≥ lg): fixed 260px sidebar + offset content.
 * Mobile / tablet (< lg): off-canvas drawer toggled by a hamburger button.
 * State is local; sidebar and topbar receive only what they need.
 */

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { WorkshopSidebar } from "./WorkshopSidebar";
import { WorkshopTopbar } from "./WorkshopTopbar";

export function WorkshopLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-app-bg,#F5F6FA)] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <WorkshopSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col min-h-screen w-full lg:ms-[260px]">
        <div className="sticky top-0 z-20">
          <WorkshopTopbar>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="workshop-sidebar"
              className="lg:hidden me-2 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </WorkshopTopbar>
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
