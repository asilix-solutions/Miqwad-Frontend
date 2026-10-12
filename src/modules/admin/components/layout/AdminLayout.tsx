/** Admin shell: persistent desktop navigation and an accessible mobile drawer. */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen bg-[var(--color-app-bg,#F5F6FA)]">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ms-[260px]">
        <div className="sticky top-0 z-30">
          <AdminTopbar>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t("towTruck.navigation")}
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                showCloseButton={false}
                aria-describedby={undefined}
                className="gap-0 p-0 motion-reduce:animate-none"
                style={{ top: 0, bottom: 0, insetInlineEnd: 0 }}
              >
                <SheetTitle className="sr-only">{t("towTruck.navigation")}</SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-3 top-3"
                    aria-label={t("towTruck.closeNavigation")}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </SheetClose>
                <AdminSidebar mobile onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </AdminTopbar>
        </div>
        <main className="min-w-0 flex-1 p-3 sm:p-5 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
