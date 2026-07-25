import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./cybr/pages/HomePage";
import { TasksPage } from "./cybr/pages/TasksPage";
import { ProjectPage } from "./cybr/pages/ProjectPage";
import { CredentialPage } from "./cybr/pages/CredentialPage";
import { ProfilePage } from "./cybr/pages/ProfilePage";
import { VerifyPage as CybrVerifyPage } from "./cybr/pages/VerifyPage";
import "./cybr/theme.css";
import "./cybr/pages.css";
import "./cybr/boards.css";

export function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />


    {/* CYBR_ design board replication (01-07) */}
    <Route path="/v2" element={<HomePage />} />
    <Route path="/v2/tasks" element={<TasksPage />} />
    <Route path="/v2/projects/:id" element={<ProjectPage />} />
    <Route path="/v2/credentials/:id" element={<CredentialPage />} />
    <Route path="/v2/profile" element={<ProfilePage />} />
    <Route path="/v2/verify/:credentialId" element={<CybrVerifyPage />} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
