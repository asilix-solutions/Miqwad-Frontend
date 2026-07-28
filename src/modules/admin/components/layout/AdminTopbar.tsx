import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@app/store";
import { useLogout } from "@modules/auth/hooks/useLogout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminTopbarProps {
  children?: ReactNode;
}

export function AdminTopbar({ children }: AdminTopbarProps) {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { logout: handleLogout } = useLogout();

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderBlockEnd: "1px solid var(--color-divider, #E5E7EB)",
      }}
    >
      <div className="flex items-center min-w-0 flex-1">
        {children}
      </div>

      <div className="flex items-center gap-4 ms-auto">
        {user ? (
          <div className="flex items-center gap-3 pe-4 border-e border-ink-200">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-ink-900 leading-tight">
                {user.fullName}
              </span>
              <span className="text-xs text-ink-500 capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <Avatar className="h-9 w-9 bg-brand-100 text-brand-700">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback>{user.fullName?.charAt(0) ?? "A"}</AvatarFallback>
            </Avatar>
          </div>
        ) : null}

        <button
          onClick={() => void handleLogout()}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-ink-600 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline-block">{t("admin.logout")}</span>
        </button>
      </div>
    </header>
  );
}
