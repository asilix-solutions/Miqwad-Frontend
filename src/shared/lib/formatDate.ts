const formatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  isoString: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "—";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    const finalOptions = options || defaultOptions;
    const cacheKey = `${locale}-${JSON.stringify(finalOptions)}`;

    if (!formatters.has(cacheKey)) {
      formatters.set(cacheKey, new Intl.DateTimeFormat(locale, finalOptions));
    }

    return formatters.get(cacheKey)!.format(date);
  } catch {
    return isoString;
  }
}
