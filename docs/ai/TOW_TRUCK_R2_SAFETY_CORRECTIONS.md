# R2 H1/H2 safety corrections

Baseline: `84af6b2fdbf300e1577464025b8f5594c3365d73`.

## Product-impact gate

**BLOCKED BY BACKEND CONTRACT for safe IntraCity availability.** All new local
assignment submissions are blocked, INCLUDING legitimate first assignments.
This is deliberate containment, not restoration of the original workflow.
The product owner must approve this temporary availability loss before rollout,
or keep rollout blocked until the backend contract is implemented and validated.
Previously accepted operations can still be reconciled read-only.

The current RawOrder projection and available backend documentation do not prove
that an unassigned local order has never been assigned, or expose the original
contractual assignment cost. Waiting, payment, totals, and missing actor/session
history are NOT such proof. No new response fields are assumed or fabricated.

`initialAssignmentBlock` remains the single shared eligibility decision used by
preparation, confirmation and the mutation preflight. A bilingual explanation
states that local first assignments are also unavailable. Known local removal
receipts remain blocked by the existing original-cost guard. InterCity driver-only
assignment and verified Paid replacement remain subject to existing guards.

## Smallest backend contract to restore availability

For FIRST assignment: return authoritative, order-bound first-assignment eligibility
that remains false after any prior assignment/removal. Enforce that same predicate
atomically in PUT; a stale GET must not permit a quote after another actor assigns
or removes a driver. An explicit operation mode or conditional/version token may
be used; a cosmetic boolean with no write enforcement is insufficient. Define
missing/unknown as unavailable. Keep payment and permissions enforced server-side.

For LOCAL REPLACEMENT: separately supply an authoritative original contract
identity/cost (and duration semantics if required), bound to an order/version,
and atomically enforce its preservation on replacement. Prefer a driver-only
replacement endpoint that preserves the stored contract. Subtotal/totalPrice
are not substitutes. First-assignment eligibility alone does not unlock replacement.
These are requirements, NOT currently implemented backend capabilities.

## Assignment acknowledgment

The committed `TOW_TRUCK_INITIAL_ASSIGNMENT.md` contract section documents HTTP
200 with `success:true`. The assignment adapter now accepts only that combination.
202 (including success:true), other resolved statuses, and malformed acknowledgments
remain uncertain. No receipt is recorded for them. Existing pending identity and
lock survive matching, delayed, changed-driver or failed GET observations and
reload. GET cannot prove completion of the earlier request; no PUT is retried.
No new final-status lookup endpoint or operator override is invented.

This document supersedes older local-eligibility and unknown-outcome retry guidance
in the historical initial-assignment document. Backend facts and source were
inspected; no authenticated live mutation was executed to re-verify the contract.

## Limits and validation

Session journals are not distributed locks. Backend atomicity, cross-admin races,
and operation finality/idempotency remain backend responsibilities. Journals already
marked acknowledged by older code do not contain HTTP status; this patch cannot
retroactively prove their acknowledgment. Review such pending records operationally
before rollout; never delete them merely to unlock writes.

Run all five existing tow-truck scripts, typecheck, build, and scoped lint/format.
R2 tests cover separate session storage, another administrator, lost markers,
zero/missing/nonzero totals, 202 plus matching/delayed/changed/failed GET, reload,
no repeated PUT, and documented 200 success. They use synthetic transport and hook
harnesses, not a browser or real backend. Browser acceptance remains separate.
