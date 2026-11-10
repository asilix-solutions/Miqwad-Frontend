/** Tracking search: local draft, URL-owned submitted value; no unverified match promise. */
import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

interface Props {
  trackSearchValue: string;
  onTrackSearchSubmit: (value: string) => void;
  onTrackSearchClear: () => void;
  isSearching: boolean;
}
export function TowTruckQueueSearchFilter({
  trackSearchValue,
  onTrackSearchSubmit,
  onTrackSearchClear,
  isSearching,
}: Props) {
  const { t } = useTranslation();
  // Reconcile URL navigation without remounting the focused input.
  const [draft, setDraft] = useState(trackSearchValue);
  const [committed, setCommitted] = useState(trackSearchValue);
  if (committed !== trackSearchValue) {
    setCommitted(trackSearchValue);
    setDraft(trackSearchValue);
  }
  const input = useRef<HTMLInputElement>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onTrackSearchSubmit(draft.trim());
  };
  const clear = () => {
    setDraft("");
    onTrackSearchClear();
    input.current?.focus();
  };
  return (
    <form
      className="tow-q-search-form"
      role="search"
      onSubmit={submit}
      aria-label={t("towTruck.searchTrackPlaceholder")}
    >
      <label htmlFor="tow-queue-search">{t("towTruck.searchTrackPlaceholder")}</label>
      <div className="tow-q-search">
        <input
          ref={input}
          id="tow-queue-search"
          type="search"
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
        />
        {(draft || trackSearchValue) && (
          <button type="button" onClick={clear} aria-label={t("towTruck.clearSearch")}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label={t("towTruck.searchButton")}
          title={t("towTruck.searchButton")}
        >
          <Search size={18} aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" role="status">
        {isSearching ? t("towTruck.searching") : ""}
      </span>
    </form>
  );
}
