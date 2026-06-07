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
