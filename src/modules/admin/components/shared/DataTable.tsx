import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Type-safe definition for a DataTable column.
 * - If `key` corresponds to a property in `T`, `render` is optional.
 * - If `key` is synthetic (e.g., "actions"), `render` should be provided.
 */
export interface DataTableColumn<T> {
  key: Extract<keyof T, string> | (string & {});
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
  errorText?: string;
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  containerClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
}

/**
 * A reusable, generic, RTL-aware data table component.
 * Uses shadcn/ui Table under the hood.
 *
 * @template T The shape of the data row.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading = false,
  isError = false,
  emptyText,
  errorText,
  getRowKey,
  onRowClick,
  containerClassName,
  headerRowClassName,
  bodyRowClassName,
}: DataTableProps<T>) {
  // RTL logical properties: text-start aligns text correctly in RTL (right) and LTR (left).
  // onRowClick applies subtle hover states.

  const containerClass =
    "bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)]";
  const headerRowClass =
    "border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]";
  const headerCellClass =
    "h-[44px] text-[12px] font-semibold tracking-wide text-[var(--color-muted)] text-start px-4 align-middle";
  const bodyRowBaseClass =
    "h-14 border-b border-[color-mix(in_srgb,var(--color-divider)_70%,transparent)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-surface-2)_60%,transparent)] transition-colors duration-150";
  const bodyCellClass =
    "px-4 text-[14px] text-[var(--color-ink-body)] align-middle text-start";

  const renderHeader = () => (
    <TableHeader>
      <TableRow className={`${headerRowClass} ${headerRowClassName ?? ""}`.trim()}>
        {columns.map((col) => (
          <TableHead key={col.key} className={`${headerCellClass} ${col.className ?? ""}`}>
            {col.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  if (isError) {
    return (
      <div className={`${containerClass} ${containerClassName ?? ""}`.trim()}>
        <Table>
          {renderHeader()}
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="py-14 text-center align-middle">
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-danger-500)_10%,transparent)]">
                    <AlertCircle className="h-10 w-10 text-[var(--color-danger-500)]" />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--color-ink-body)]">{errorText}</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${containerClass} ${containerClassName ?? ""}`.trim()}>
        <Table>
          {renderHeader()}
          <TableBody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className={`${bodyRowBaseClass} ${bodyRowClassName ?? ""}`.trim()}>
                {columns.map((col, colIndex) => (
                  <TableCell key={col.key} className={bodyCellClass}>
                    <Skeleton className={`h-[14px] rounded ${colIndex === 0 ? "w-[60%]" : "w-[40%]"}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={`${containerClass} ${containerClassName ?? ""}`.trim()}>
      <Table>
        {renderHeader()}
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-14 text-center align-middle">
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
                    <Inbox className="h-10 w-10 text-[var(--color-muted)]" />
                  </div>
                  <span className="text-[14px] text-[var(--color-muted)]">{emptyText}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`${bodyRowBaseClass} ${onRowClick ? "cursor-pointer" : ""} ${bodyRowClassName ?? ""}`.trim()}
              >
                {columns.map((col) => {
                  // Type-safe access without `any`. We fall back to indexing the row
                  // as keyof T if no render function is provided.
                  const cellContent = col.render
                    ? col.render(row)
                    : (row[col.key as keyof T] as ReactNode);

                  return (
                    <TableCell key={col.key} className={`${bodyCellClass} ${col.className ?? ""}`}>
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
