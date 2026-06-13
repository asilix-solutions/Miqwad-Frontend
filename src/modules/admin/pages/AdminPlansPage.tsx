import { Navigate } from "react-router-dom";

export function AdminPlansPage() {
  return <Navigate to="/admin/subscriptions?tab=plans" replace />;
}

