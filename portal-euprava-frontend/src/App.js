import React from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth";
import HomeCitizen from "./pages/HomeCitizen";
import HomeOfficer from "./pages/HomeOfficer";
import HomeAdmin from "./pages/HomeAdmin";
import NewRequestCitizen from "./pages/NewRequestCitizen"; // ✅ DODATO
import ProtectedRoute from "./components/ProtectedRoute";

import { getRole, isLoggedIn } from "./utils/auth";

function RoleRedirect() {
  if (!isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }

  const role = getRole();

  if (role === "ADMIN") return <Navigate to="/home-admin" replace />;
  if (role === "OFFICER") return <Navigate to="/home-officer" replace />;
  return <Navigate to="/home-citizen" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/home-citizen"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <HomeCitizen />
          </ProtectedRoute>
        }
      />

      {/* ✅ NOVI ZAHTEV (CITIZEN) */}
      <Route
        path="/citizen/new-request"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <NewRequestCitizen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home-officer"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <HomeOfficer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home-admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <HomeAdmin />
          </ProtectedRoute>
        }
      />

      {/* opciono: fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
