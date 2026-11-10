/** Read-only presentation: restrictions never confer permission to perform an operation. */
import type { TowTruckOrder } from "./towTruckModel";
import { initialAssignmentBlock } from "./dispatchModel";
import { replacementBlock, type RemovalEvidence } from "./reassignment";

export function previewRestrictions(order: TowTruckOrder, evidence: RemovalEvidence): string[] {
  const warnings = new Set<string>();
  if (order.dispatchService === "unknown") warnings.add("r2ServiceUnverified");
  if (!order.status) warnings.add("statusUnknown");
  if (order.assignment === "unknown") warnings.add("driverStateUnknown");
  if (!order.paymentStatus) warnings.add("p3rPaymentUnknown");
  if (order.missingTrip) warnings.add("checkHint");
  if (order.sameLocations) warnings.add("sameLocations");
  for (const point of [order.origin, order.destination]) {
    if (point.quality === "missing") warnings.add("locationMissing");
    if (point.quality === "invalid") warnings.add("locationInvalid");
    if (point.quality === "suspect") warnings.add("locationSuspect");
  }
  // Preserve independent service/payment/evidence restrictions even when an earlier guard wins.
  if (
    !evidence &&
    order.isInterCity &&
    order.paymentStatus === "Paid" &&
    order.assignment === "unassigned"
  )
    warnings.add("assignmentPaidInterCityBlocked");
  const replacement = replacementBlock(order, evidence);
  if (replacement) warnings.add(replacement);
  if (order.assignment === "unassigned" && order.status === "InWaiting") {
    const blocked = initialAssignmentBlock(order, evidence);
    if (blocked) warnings.add(blocked);
  }
  return [...warnings];
}

/** Service-specific read-only fields; conflicting dispatch classification remains conservative. */
export function previewLocations(order: TowTruckOrder) {
  const service = order.dispatchService === "unknown" ? "unknown" : order.serviceType;
  if (service === "intercity") {
    const fields = [
      { label: "f1OriginCity", value: order.intercityDetails.originCityName },
      { label: "f1DestinationCity", value: order.intercityDetails.destinationCityName },
    ];
    if (!order.intercityDetails.originCityName && (order.origin.title ?? order.origin.description))
      fields.push({
        label: "f2OriginAddress",
        value: order.origin.title ?? order.origin.description,
      });
    if (
      !order.intercityDetails.destinationCityName &&
      (order.destination.title ?? order.destination.description)
    )
      fields.push({
        label: "f2DestinationAddress",
        value: order.destination.title ?? order.destination.description,
      });
    return fields;
  }
  return [
    {
      label: service === "intracity" ? "f1Pickup" : "f1RecordedOrigin",
      value: order.origin.title ?? order.origin.description,
    },
    {
      label: service === "intracity" ? "f1Dropoff" : "f1RecordedDestination",
      value: order.destination.title ?? order.destination.description,
    },
  ];
}
