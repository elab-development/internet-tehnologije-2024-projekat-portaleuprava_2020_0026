import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "../utils/auth";

export default function ProtectedRoute({ children, roles }) {
  const auth = getAuth();

  if (!auth?.token) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && roles.length > 0) {
    const role = auth?.user?.role;
    if (!roles.includes(role)) {
      return <Navigate to="/auth" replace />;
    }
  }

  return children;
}
