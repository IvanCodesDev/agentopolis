import { Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "./pixel/pages/BoardPage";
import { QuestPage } from "./pixel/pages/QuestPage";
import { ReviewPage } from "./pixel/pages/ReviewPage";
import { PassportPage, VerifyPage } from "./pixel/pages/PassportPage";
import { RouteAnnouncer } from "./pixel/components";
import { HomePage } from "./cybr/pages/HomePage";
import { TasksPage } from "./cybr/pages/TasksPage";
import { ProjectPage } from "./cybr/pages/ProjectPage";
import { CredentialPage } from "./cybr/pages/CredentialPage";
import { ProfilePage } from "./cybr/pages/ProfilePage";
import { VerifyPage as CybrVerifyPage } from "./cybr/pages/VerifyPage";
import { DesignSystemPage } from "./cybr/pages/DesignSystemPage";
import "./cybr/theme.css";
import "./cybr/pages.css";
import "./cybr/boards.css";

export function App() {
  return <><RouteAnnouncer /><Routes>
    <Route path="/" element={<BoardPage />} />
    <Route path="/quests/:id" element={<QuestPage />} />
    <Route path="/guild/quests/:id/review" element={<ReviewPage />} />
    <Route path="/passport/:address" element={<PassportPage />} />
    <Route path="/verify/:credentialId" element={<VerifyPage />} />

    {/* CYBR_ design board replication (01-07) */}
    <Route path="/v2" element={<HomePage />} />
    <Route path="/v2/tasks" element={<TasksPage />} />
    <Route path="/v2/projects/:id" element={<ProjectPage />} />
    <Route path="/v2/credentials/:id" element={<CredentialPage />} />
    <Route path="/v2/profile" element={<ProfilePage />} />
    <Route path="/v2/verify/:credentialId" element={<CybrVerifyPage />} />
    <Route path="/v2/design" element={<DesignSystemPage />} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></>;
}
