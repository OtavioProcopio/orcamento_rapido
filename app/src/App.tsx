import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { BudgetPage } from "./pages/BudgetPage";
import { DataManagementPage } from "./pages/DataManagementPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LegalPage } from "./pages/LegalPage";

export function App() {
  return (
    <BrowserRouter basename={__APP_BASENAME__}>
      <ErrorBoundary>
        <main className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500/30">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/builder" element={<BudgetPage />} />
            <Route path="/data" element={<DataManagementPage />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route
              path="/storage-notice"
              element={<LegalPage type="storage" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
export default App;
