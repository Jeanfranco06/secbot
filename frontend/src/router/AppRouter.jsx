import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequirePermission } from "./Protected";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import KB from "@/pages/KB";
import Reports from "@/pages/Reports";
import Audit from "@/pages/Audit";
import AdminUsers from "@/pages/AdminUsers";
import AdminRoles from "@/pages/AdminRoles";
import Sessions from "@/pages/Sessions";
import Compliance from "@/pages/Compliance";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />

          <Route
            path="/dashboard"
            element={
              <RequirePermission permission="dashboard.view">
                <Dashboard />
              </RequirePermission>
            }
          />

          <Route
            path="/tickets"
            element={
              <RequirePermission anyOf={["ticket.view_all", "ticket.view_own"]}>
                <Tickets />
              </RequirePermission>
            }
          />
          <Route path="/tickets/:id" element={<TicketDetail />} />

          <Route
            path="/kb"
            element={
              <RequirePermission permission="kb.manage"><KB /></RequirePermission>
            }
          />

          <Route
            path="/reports"
            element={
              <RequirePermission permission="report.export"><Reports /></RequirePermission>
            }
          />

          <Route
            path="/audit"
            element={
              <RequirePermission permission="audit.view"><Audit /></RequirePermission>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RequirePermission permission="users.manage"><AdminUsers /></RequirePermission>
            }
          />

          <Route
            path="/admin/roles"
            element={
              <RequirePermission permission="users.manage"><AdminRoles /></RequirePermission>
            }
          />

          <Route
            path="/compliance"
            element={
              <RequirePermission permission="audit.view"><Compliance /></RequirePermission>
            }
          />

          <Route path="/sessions" element={<Sessions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}