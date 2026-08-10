import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { BudgetPage } from "./pages/BudgetPage";
import { DataManagementPage } from "./pages/DataManagementPage";
import { ClientsPage } from "./pages/ClientsPage";
import { PipelinePage } from "./pages/PipelinePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LegalPage } from "./pages/LegalPage";
import { trackPageview } from "./utils/analytics";

// count.js roda com no_onload (ver index.html): sem esse componente, uma
// SPA nunca dispara um segundo pageview sozinha — troca de rota não recarrega
// a página. Renderizado dentro do Router pra ter acesso a useLocation, e
// dispara inclusive no primeiro carregamento (efeito roda no mount).
const PageviewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Mesmo truque de setTimeout(0) + clearTimeout usado em useBudget/
    // useClients/useProfiles: em StrictMode (dev) o React monta, desmonta e
    // remonta o efeito de propósito, e sem isso cada rota seria contada
    // duas vezes. O timer fantasma da primeira montagem é cancelado antes
    // de disparar; só a segunda chega a rodar de verdade.
    const timer = window.setTimeout(() => {
      trackPageview(location.pathname);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return null;
};

export function App() {
  return (
    <BrowserRouter basename={__APP_BASENAME__}>
      <ErrorBoundary>
        <PageviewTracker />
        <main className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500/30">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/builder" element={<BudgetPage />} />
            <Route path="/data" element={<DataManagementPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
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
