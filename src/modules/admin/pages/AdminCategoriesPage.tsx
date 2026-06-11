/**
 * @file AdminCategoriesPage.tsx
 * @description Thin wrapper kept for backwards-compatibility.
 *
 * The standalone /admin/categories route now redirects to
 * /admin/reference?tab=categories (see router.tsx). This file is retained
 * so that any existing import in tests or other pages continues to compile,
 * but in production the route is never reached — the redirect fires first.
 *
 * The real CRUD panel lives in:
 *   src/modules/admin/components/reference/CategoriesPanel.tsx
 */

import { Navigate } from "react-router-dom";

export function AdminCategoriesPage() {
  return <Navigate to="/admin/reference?tab=categories" replace />;
}
