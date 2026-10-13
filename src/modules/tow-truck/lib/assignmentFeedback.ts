import { AppError } from "@shared/types/api";
import type { AdminUserRow } from "@modules/admin/types";

// No stable busy-driver code is documented. Match only the exact, user-verified
// HTTP 409 message (allow surrounding whitespace, not fuzzy/substring matches).
const busyDriverMessage = "سائق السطحة مشغول بطلب آخر حاليًا";

export function assignmentRejection(error: unknown): string | null {
  if (!(error instanceof AppError)) return null;
  if (error.code === "ASSIGNMENT_REJECTED" && error.status === undefined)
    return "assignmentRejected";
  switch (error.status) {
    case 400:
      return "assignmentInvalidRequest";
    case 401:
      return "assignmentAuthentication";
    case 403:
      return "assignmentForbidden";
    case 404:
      return "assignmentMissing";
    case 409:
      return typeof error.message === "string" && error.message.trim() === busyDriverMessage
        ? "assignmentDriverBusy"
        : "assignmentConflict";
    case 422:
      return "assignmentValidation";
    default:
      return null;
  }
}

// Only controlled translation keys cross into presentation. Backend message,
// fields and errors are never rendered, even if they contain plausible text.
export function uncertainAssignmentReason(error: unknown): string {
  if (error instanceof AppError) {
    if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code)) return "submissionTimeout";
    if (error.status && error.status >= 500) return "submissionServerError";
    if (error.code === "ASSIGNMENT_UNCERTAIN") return "submissionMalformed";
    if (["ERR_NETWORK", "NETWORK_ERROR"].includes(error.code)) return "submissionNetwork";
  }
  return "submissionUnknown";
}

export function driverEligibilityMessage(driver: AdminUserRow, expectedId: string): string | null {
  if (driver.id !== expectedId) return "driverChanged";
  if (driver.role !== 5) return "driverWrongRole";
  if (driver.isActive === false) return "driverInactive";
  if (driver.isActive !== true) return "driverChanged";
  return null;
}

export function readFailureMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.status === 401) return "readAuthentication";
    if (error.status === 403) return "readForbidden";
    if (error.status === 404) return "readMissing";
    if (error.code === "TOW_ORDER_TYPE") return "orderWrongType";
    if (error.code === "TOW_ORDER_ID") return "orderIdentityInvalid";
  }
  return "errorHint";
}
