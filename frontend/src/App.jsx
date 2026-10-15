import { lazy, Suspense, useEffect, useState } from "react";
import AppShell from "./components/layout/AppShell";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { useApp } from "./context/AppContext";
import AuthPage from "./pages/AuthPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";

const pages = {
  dashboard: lazy(() => import("./pages/DashboardPage")),
  profiles: lazy(() => import("./pages/ProfilesPage")),
  health: lazy(() => import("./pages/HealthPage")),
  weight: lazy(() => import("./pages/WeightPage")),
  measurements: lazy(() => import("./pages/MeasurementsPage")),
  "body-metrics": lazy(() => import("./pages/BodyMetricsPage")),
  nutrition: lazy(() => import("./pages/NutritionPage")),
  meals: lazy(() => import("./pages/MealsPage")),
  "meal-history": lazy(() => import("./pages/MealHistoryPage")),
  recipes: lazy(() => import("./pages/RecipesPage")),
  tasks: lazy(() => import("./pages/TasksPage")),
  reminders: lazy(() => import("./pages/RemindersPage")),
  progress: lazy(() => import("./pages/ProgressPage")),
  settings: lazy(() => import("./pages/SettingsPage")),
  goals: lazy(() => import("./pages/GoalsPage")),
};
function readPage() {
  const page = window.location.hash.replace(/^#\/?/, "");
  return Object.hasOwn(pages, page) ? page : "dashboard";
}
function Loading({ children }) {
  return <main className="loading-screen" role="status"><div className="loading-orb" /><strong>VYRA</strong><span>{children}</span></main>;
}

export default function App() {
  const { sessionLoading, profilesLoading, profilesReady, profilesError, user, profiles,
    globalError, setGlobalError, dataStatus, initializeSession, refreshProfiles,
    refreshSelectedProfile, refreshWeightHistory, refreshNutritionDay, logout } = useApp();
  const [activePage, setActivePage] = useState(readPage);
  useEffect(() => {
    const change = () => setActivePage(readPage());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => { document.title = `${activePage.replaceAll("-", " ")} · VYRA`; }, [activePage]);
  function navigate(page) { if (Object.hasOwn(pages, page)) window.location.hash = `/${page}`; }
  function retryData() {
    setGlobalError("");
    refreshProfiles(); refreshSelectedProfile(); refreshWeightHistory(); refreshNutritionDay();
  }
  const errorNotice = globalError && (
    <div className="global-error" role="alert">
      <span>{globalError}</span>{" "}
      <button className="text-button" onClick={user ? retryData : initializeSession}>Retry loading</button>{" "}
      <button className="text-button" aria-label="Dismiss error" onClick={() => setGlobalError("")}>Dismiss</button>
    </div>
  );
  if (sessionLoading) return <Loading>Checking secure session…</Loading>;
  if (!user) return <>{errorNotice}<AuthPage /></>;
  if (!profilesReady) {
    if (profilesLoading) return <Loading>Loading profiles…</Loading>;
    return <main className="loading-screen"><div role="alert">{profilesError || "Profiles could not be loaded."}</div><button onClick={() => refreshProfiles()}>Retry profiles</button><button onClick={logout}>Sign out</button></main>;
  }
  if (profiles.length === 0) return <>{errorNotice}<ProfileSetupPage /></>;
  const Page = pages[activePage];
  return (
    <AppShell activePage={activePage} onNavigate={navigate}>
      {errorNotice}
      {Object.values(dataStatus).includes("loading") && <p role="status">Updating profile data…</p>}
      <ErrorBoundary key={activePage}>
        <Suspense fallback={<p role="status">Loading page…</p>}>
          <div className="page-enter"><Page onNavigate={navigate} /></div>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
