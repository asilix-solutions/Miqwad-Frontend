/**
 * Category tree builder and path resolver.
 * Converts a flat ServiceCategory list into a nested CategoryTreeNode tree,
 * and resolves a leaf node back up to its L1/L2/L3 ancestors.
 * Used by admin category management and provider CategoryCascader.
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

/**
 * Resolve a leaf category id up to its L1 / L2 / L3 ancestors.
 * Any slot may be null if the id is not found or the tree is shallower than expected.
 */
export function getCategoryPath(
  categories: ServiceCategory[],
  leafId: number,
): { l1: ServiceCategory | null; l2: ServiceCategory | null; l3: ServiceCategory | null } {
  const byId = new Map<number, ServiceCategory>(categories.map((c) => [c.id, c]));
  const leaf = byId.get(leafId) ?? null;
  if (!leaf) return { l1: null, l2: null, l3: null };

  if (leaf.level === 3) {
    const l2 = leaf.parentId != null ? (byId.get(leaf.parentId) ?? null) : null;
    const l1 = l2?.parentId != null ? (byId.get(l2.parentId) ?? null) : null;
    return { l1, l2, l3: leaf };
  }
  if (leaf.level === 2) {
    const l1 = leaf.parentId != null ? (byId.get(leaf.parentId) ?? null) : null;
    return { l1, l2: leaf, l3: null };
  }
  return { l1: leaf, l2: null, l3: null };
}
