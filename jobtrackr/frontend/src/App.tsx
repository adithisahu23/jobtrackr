import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { BoardPage } from "./pages/BoardPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/board" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
          <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
