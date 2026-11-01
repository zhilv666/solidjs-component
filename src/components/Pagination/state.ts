export function getPaginationCount(count: number): number {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Pagination count must be a non-negative safe integer.");
  }
  return Math.max(1, count);
}

/** Page bounds are presentation constraints, not unsolicited change requests. */
export function clampPaginationPage(page: number, count: number): number {
  const integer = Number.isFinite(page) ? Math.floor(page) : 1;
  return Math.min(Math.max(1, integer), getPaginationCount(count));
}
