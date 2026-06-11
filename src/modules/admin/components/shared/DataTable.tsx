import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
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
}: DataTableProps<T>) {
  // RTL logical properties: text-start aligns text correctly in RTL (right) and LTR (left).
  // onRowClick applies subtle hover states.

  const containerClass =
    "overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm";
  const headerRowClass =
    "border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]";
  const headerCellClass =
    "h-11 px-4 text-start text-[13px] font-medium text-[var(--color-muted)] align-middle";
  const bodyRowBaseClass =
    "border-b border-[var(--color-divider)] last:border-0 transition-colors hover:bg-[var(--color-surface-2)]";
  const bodyCellClass =
    "h-14 px-4 text-start text-sm text-[var(--color-ink-body)] align-middle";

  const renderHeader = () => (
    <TableHeader>
      <TableRow className={headerRowClass}>
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
      <div className={containerClass}>
        <Table>
          {renderHeader()}
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center align-middle">
                <div className="flex flex-col items-center justify-center gap-3 text-[var(--color-muted)]">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <span className="text-sm">{errorText}</span>
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
      <div className={containerClass}>
        <Table>
          {renderHeader()}
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} className={bodyRowBaseClass}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={bodyCellClass}>
                    <Skeleton className="h-5 w-full" />
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
    <div className={containerClass}>
      <Table>
        {renderHeader()}
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center align-middle">
                <div className="flex flex-col items-center justify-center gap-3 text-[var(--color-muted)]">
                  <span className="text-sm">{emptyText}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`${bodyRowBaseClass} ${onRowClick ? "cursor-pointer" : ""}`}
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
