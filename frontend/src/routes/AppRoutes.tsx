import NotFoundPage from "@/components/NotFoundPage";
import { SignIn, SignUp } from "@/features/auth";
import { DeliveryLog } from "@/features/delivery-log";
import { Incidents } from "@/features/incidents";
import { Integrations } from "@/features/integrations";
import { InvitePage } from "@/features/invite";
import {
  AllMembers,
  AllUnavailabilities,
  Team,
  TeamMembers,
  Teams,
  TeamUnavailabilities,
} from "@/features/organization";
import { SettingPage } from "@/features/settings";
import { Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { GuestOnly } from "./GuestOnly";
import { MyTeam } from "@/features/my-team";
import { MyUnavailabilities } from "@/features/my-unavailabilities";
import { StatusPage } from "@/features/status";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequireAuth } from "./RequireAuth";
import { IncidentsDetails } from "@/features/incidents/pages";
import { LandingPage, PrivacyPage, TermsPage } from "@/features/landing";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* Everything below requires being logged in */}
      <Route element={<RequireAuth />}>
        {/* Manager only */}
        <Route element={<ProtectedRoute allowedRole="SRE" />}>
          <Route element={<AppLayout />}>
            <Route path="/manager/teams" element={<Teams />} />
            <Route path="/manager/teams/:id" element={<Team />} />
            <Route
              path="/manager/teams/:id/members"
              element={<TeamMembers />}
            />
            <Route
              path="/manager/teams/:id/unavailabilities"
              element={<TeamUnavailabilities />}
            />
            <Route path="/manager/engineers" element={<AllMembers />} />
            <Route
              path="/manager/unavailabilities"
              element={<AllUnavailabilities />}
            />
            <Route
              path="/manager/time-off"
              element={<div>manage time-off</div>}
            />
            <Route path="/manager/incidents" element={<Incidents />} />
            <Route
              path="/manager/incidents/:id"
              element={<IncidentsDetails />}
            />
            <Route path="/manager/integrations" element={<Integrations />} />
            <Route path="/manager/delivery-log" element={<DeliveryLog />} />
          </Route>
        </Route>

        {/* Engineer only */}
        <Route element={<ProtectedRoute allowedRole="ENGINEER" />}>
          <Route element={<AppLayout />}>
            <Route path="/engineer/incidents" element={<Incidents />} />
            <Route
              path="/engineer/incidents/:id"
              element={<IncidentsDetails />}
            />
            <Route path="/engineer/my-team" element={<MyTeam />} />
            <Route
              path="/engineer/my-unavailabilities"
              element={<MyUnavailabilities />}
            />
          </Route>
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/settings" element={<SettingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
