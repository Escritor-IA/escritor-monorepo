import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, type ReactElement } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Dashboard } from "@/pages/Dashboard";
import { ProjectPage } from "@/pages/ProjectPage";
import { ChapterPage } from "@/pages/ChapterPage";
import { NotFound } from "@/pages/NotFound";

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AuthProvider({ children }: { children: ReactElement }) {
  const { isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !useAuthStore.getState().user) {
      authApi.me().then(({ data }) => setUser(data)).catch(() => {});
    }
  }, [isAuthenticated, setUser]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <RequireAuth>
                <ProjectPage />
              </RequireAuth>
            }
          />
          <Route
            path="/chapters/:id"
            element={
              <RequireAuth>
                <ChapterPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
