import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Car,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Languages,
  Menu,
  X,
  LayoutGrid,
  Briefcase,
  Wrench,
  ShieldCheck,
  MapPin,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@app/store";
import { logout } from "@modules/auth/store/authSlice";
import { authApi } from "@modules/auth/api/authApi";
import i18n from "@app/i18n";
import { cn } from "@shared/lib/utils";
import type { UserRole } from "@modules/auth/types";

/**
 * Authenticated WEB shell — top bar (mobile) + side nav + main outlet.
 *
 * The nav block is now role-aware:
 *  - customer (default): dashboard, vehicles, services catalog, profile,
 *    and a "become a provider" CTA.
 *  - provider: services, profile.
 *  - admin: providers review, profile.
 *
 * Responsiveness:
 *  - lg+: sidebar is permanently visible, no top bar.
 *  - mobile/tablet: sidebar slides in as a drawer; backdrop closes it.
 */
export function AppLayout() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort: clear locally even if the server call fails.
    }
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  const closeDrawer = () => setMobileOpen(false);

  const role: UserRole = user?.role ?? "customer";
  const navItems = navItemsForRole(role);

  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Backdrop — only visible on mobile when drawer is open */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="close menu"
          onClick={closeDrawer}
          className="fixed inset-0 bg-ink-900/40 z-20 lg:hidden"
        />
      )}

      {/* Sidebar — fixed on lg+, slide-in drawer on smaller screens. */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 start-0 z-30 w-64 max-w-[85vw] bg-white border-e border-ink-200 flex flex-col transition-transform",
          mobileOpen
            ? "translate-x-0 rtl:translate-x-0"
            : "-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-brand-500 text-white">
            <Car className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold text-ink-900">
            {t("common.appName")}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              onClick={closeDrawer}
            >
              {t(item.labelKey)}
            </NavItem>
          ))}

          {/* "Become a provider" CTA — only for customers who haven't applied. */}
          {role === "customer" && (
            <div className="mt-4 pt-4 border-t border-ink-100">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <NavLink to="/provider/register" onClick={closeDrawer}>
                  <Briefcase className="h-4 w-4" />
                  {t("providers.becomeProvider")}
                </NavLink>
              </Button>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-ink-100 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] bg-ink-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold shrink-0">
                {user.fullName?.charAt(0) ?? "م"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 truncate">{user.fullName}</p>
                <p className="text-xs text-ink-500 truncate">{user.phoneNumber}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="flex-1">
              <Languages className="h-4 w-4" />
              {i18n.language === "ar" ? "EN" : "ع"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1">
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 bg-white border-b border-ink-200 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-[var(--radius-sm)] hover:bg-ink-100"
            aria-label="menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-display font-semibold text-ink-900">{t("common.appName")}</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface NavItemSpec {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

function navItemsForRole(role: UserRole): NavItemSpec[] {
  switch (role) {
    case "admin":
      return [
        {
          to: "/admin/providers",
          labelKey: "admin.providersTitle",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          to: "/admin/profile",
          labelKey: "profile.title",
          icon: <UserIcon className="h-4 w-4" />,
        },
      ];
    case "provider":
      return [
        {
          to: "/provider/services",
          labelKey: "providers.services.title",
          icon: <Wrench className="h-4 w-4" />,
        },
        {
          to: "/provider/profile",
          labelKey: "profile.title",
          icon: <UserIcon className="h-4 w-4" />,
        },
      ];
    case "driver":
    case "customer":
    default:
      return [
        {
          to: "/app/dashboard",
          labelKey: "common.appName",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          to: "/app/vehicles",
          labelKey: "vehicles.title",
          icon: <Car className="h-4 w-4" />,
        },
        {
          to: "/app/services/nearby",
          labelKey: "discovery.nav",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          to: "/app/services",
          labelKey: "servicesCatalog.title",
          icon: <LayoutGrid className="h-4 w-4" />,
        },
        {
          to: "/app/favorites",
          labelKey: "discovery.favoritesNav",
          icon: <Heart className="h-4 w-4" />,
        },
        {
          to: "/app/profile",
          labelKey: "profile.title",
          icon: <UserIcon className="h-4 w-4" />,
        },
      ];
  }
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}

function NavItem({ to, icon, onClick, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-brand-600"
            : "text-ink-700 hover:bg-ink-100",
        )
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}
