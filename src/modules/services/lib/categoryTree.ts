/**
 * Category tree builder.
 * Converts a flat ServiceCategory list into a nested CategoryTreeNode tree.
 * Used by admin category management (Phase 3) and provider service cascaders.
 */

import type { ServiceCategory, CategoryTreeNode } from "@modules/services/types";
import type { ProviderType } from "@modules/providers/types";

/**
 * Build a nested tree from a flat category list.
 * Pass `providerType` to restrict the result to nodes scoped to that provider
 * type plus globally-scoped nodes (providerTypeScope === null).
 */
export function getCategoryTree(
  categories: ServiceCategory[],
  providerType?: ProviderType,
): CategoryTreeNode[] {
  const eligible = providerType
    ? categories.filter(
        (c) => c.providerTypeScope === null || c.providerTypeScope === providerType,
      )
    : categories;

  const nodeMap = new Map<number, CategoryTreeNode>();
  for (const cat of eligible) {
    nodeMap.set(cat.id, { ...cat, children: [] });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]): void => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);

  return roots;
}
