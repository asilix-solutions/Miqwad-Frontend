/**
 * Common API contracts shared across modules.
 * These mirror the backend `Result<T>` / `ErrorResponse` patterns
 * described in the MVP plan.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Standard paginated response shape for admin endpoints.
 *
 * Extends the simpler `Paginated<T>` with a pre-computed `totalPages`
 * field.  This is the agreed contract between the frontend and the
 * .NET backend — an adapter layer can normalise raw backend responses
 * (which may use `Count`, `TotalRecords`, etc.) into this shape.
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** User-facing error normalised from axios/network errors. */
export class AppError extends Error {
  code: string;
  fields?: Record<string, string[]>;
  status?: number;

  constructor(message: string, code = "UNKNOWN", status?: number, fields?: Record<string, string[]>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}
