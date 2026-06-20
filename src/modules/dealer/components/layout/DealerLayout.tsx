import { Outlet } from "react-router-dom";
import { DealerSidebar } from "./DealerSidebar";
import { DealerTopbar } from "./DealerTopbar";

export function DealerLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-app-bg,#F5F6FA)] flex">
      <DealerSidebar />
      <div className="flex flex-col min-h-screen w-full ms-[260px]">
        <div className="sticky top-0 z-30">
          <DealerTopbar />
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
