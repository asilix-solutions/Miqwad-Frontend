/**
 * @file CategoriesPanel.tsx
 * @description Categories management panel — wires <CategoryTree> into the
 * AdminReferenceDataPage categories tab. The tree owns all CRUD dialogs.
 */

import { CategoryTree } from "./category-tree/CategoryTree";

export function CategoriesPanel() {
  return <CategoryTree />;
}
