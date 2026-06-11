import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface AdminBreadcrumbItem {
  label: string;
  to?: string;
}

export interface AdminBreadcrumbProps {
  /**
   * Additional items to append after the default "Dashboard" link.
   * If omitted, only the Dashboard link is shown.
   */
  items?: AdminBreadcrumbItem[];
}

export function AdminBreadcrumb({ items = [] }: AdminBreadcrumbProps) {
  const { t } = useTranslation();

  const allItems: AdminBreadcrumbItem[] = [
    { label: t("adminNav.dashboard"), to: "/admin/dashboard" },
    ...items,
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {isLast || !item.to ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="rtl:rotate-180" />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
