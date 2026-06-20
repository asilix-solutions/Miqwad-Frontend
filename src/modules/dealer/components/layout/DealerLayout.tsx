/**
 * @file DealerLayout.tsx
 *
 * Responsive shell for the dealer provider area.
 * Desktop (≥ lg): fixed 260px sidebar + offset content — identical to before.
 * Mobile / tablet (< lg): sidebar becomes an off-canvas drawer toggled by a
 * hamburger button injected into DealerTopbar's children slot.
 *
 * State lives here (one useState); sidebar and topbar receive only what they need.
 * Drawer closes on navigation (useLocation) and on Escape.
 */

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { DealerSidebar } from "./DealerSidebar";
import { DealerTopbar } from "./DealerTopbar";

export function DealerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close drawer whenever the route changes (NavLink click, programmatic nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-app-bg,#F5F6FA)] flex">
      {/* ── Mobile backdrop (click to close) ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <DealerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Content area ────────────────────────────────────────────────── */}
      {/*
        On desktop: lg:ms-[260px] offsets by the fixed sidebar width.
        On mobile:  no margin — content is full-width.
      */}
      <div className="flex flex-col min-h-screen w-full lg:ms-[260px]">
        <div className="sticky top-0 z-20">
          <DealerTopbar>
            {/* Hamburger — rendered on mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="dealer-sidebar"
              className="lg:hidden me-2 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </DealerTopbar>
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
