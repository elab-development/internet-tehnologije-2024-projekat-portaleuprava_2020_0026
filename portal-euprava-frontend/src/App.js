import React from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth";
import HomeCitizen from "./pages/HomeCitizen";
import HomeOfficer from "./pages/HomeOfficer";
import HomeAdmin from "./pages/HomeAdmin";
import NewRequestCitizen from "./pages/NewRequestCitizen"; 
import MyRequestsCitizen from "./pages/MyRequestsCitizen";
import ServicesCitizen from "./pages/ServicesCitizen";
import InboxOfficer from "./pages/InboxOfficer";
import AssignedToMeRequestsOfficer from "./pages/AssignedToMeRequestsOfficer";
import StatisticsOfficer from "./pages/StatisticsOfficer";
import ProtectedRoute from "./components/ProtectedRoute";
import StatisticsAdmin from "./pages/StatisticsAdmin";
import InstitutionsAdmin from "./pages/InstitutionsAdmin";
import ServicesAdmin from "./pages/ServicesAdmin";
import UsersAdmin from "./pages/UsersAdmin";

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

      {/* NOVI ZAHTEV (CITIZEN) */}
      <Route
        path="/citizen/new-request"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <NewRequestCitizen />
          </ProtectedRoute>
        }
      />

      {/* MOJI ZAHTEVI (CITIZEN) */}
      <Route
        path="/citizen/requests"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <MyRequestsCitizen />
          </ProtectedRoute>
        }
      />

      {/* SERVISI (CITIZEN) */}
      <Route
        path="/citizen/services"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <ServicesCitizen />
          </ProtectedRoute>
        }
      />

      {/* INBOX (OFFICER) */}
      <Route
        path="/officer/inbox"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <InboxOfficer />
          </ProtectedRoute>
        }
      />

      {/* DODELJENI ZAHTEVI (OFFICER) */}
      <Route
        path="/officer/assigned"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <AssignedToMeRequestsOfficer />
          </ProtectedRoute>
        }
      />

      {/* STATISTIKA (OFFICER) */}
      <Route
        path="/officer/stats"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <StatisticsOfficer />
          </ProtectedRoute>
        }
      />

      {/* STATISTIKA (ADMIN) */}
      <Route
        path="/admin/stats"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <StatisticsAdmin />
          </ProtectedRoute>
        }
      />

      {/* STATISTIKA (ADMIN) */}
      <Route
        path="/admin/stats"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <StatisticsAdmin />
          </ProtectedRoute>
        }
      />

      {/* INSTITUCIJE (ADMIN) */}
      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <InstitutionsAdmin />
          </ProtectedRoute>
        }
      />

      {/* SERVISI (ADMIN) */}
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ServicesAdmin />
          </ProtectedRoute>
        }
      />  

      {/* KORISNICI (ADMIN) */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <UsersAdmin />
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
