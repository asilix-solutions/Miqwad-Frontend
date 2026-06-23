/**
 * @file ScrapPartRequestDetailPage.tsx
 *
 * Full-page route for a single part request detail (/part-requests/:id).
 * Renders the same PartRequestDetailContent used by the list-page dialog.
 */

import { useParams } from "react-router-dom";
import { PartRequestDetailContent } from "../components/PartRequestDetailContent";

/** Full-page wrapper for part request detail — mirrors the dialog content. */
export function ScrapPartRequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <div className="mx-auto max-w-2xl provider-fade-up">
      <PartRequestDetailContent requestId={id} />
    </div>
  );
}
