import {
  useMemo,
  useState
} from "react";

import AppShell
  from "./components/layout/AppShell";

import {
  useApp
} from "./context/AppContext";

import AuthPage
  from "./pages/AuthPage";

import BodyMetricsPage
  from "./pages/BodyMetricsPage";

import DashboardPage
  from "./pages/DashboardPage";

import HealthPage
  from "./pages/HealthPage";

import MealHistoryPage
  from "./pages/MealHistoryPage";

import MealsPage
  from "./pages/MealsPage";

import MeasurementsPage
  from "./pages/MeasurementsPage";

import NutritionPage
  from "./pages/NutritionPage";

import ProfileSetupPage
  from "./pages/ProfileSetupPage";

import ProfilesPage
  from "./pages/ProfilesPage";

import ProgressPage
  from "./pages/ProgressPage";

import RecipesPage
  from "./pages/RecipesPage";

import RemindersPage
  from "./pages/RemindersPage";

import SettingsPage
  from "./pages/SettingsPage";

import TasksPage
  from "./pages/TasksPage";

import WeightPage
  from "./pages/WeightPage";

export default function App() {
  const {
    sessionLoading,
    profilesLoading,
    user,
    profiles,
    globalError,
    setGlobalError
  } =
    useApp();

  const [
    activePage,
    setActivePage
  ] =
    useState(
      "dashboard"
    );

  const page =
    useMemo(() => {
      switch (
        activePage
      ) {
        case "profiles":
          return (
            <ProfilesPage />
          );

        case "health":
          return (
            <HealthPage />
          );

        case "weight":
          return (
            <WeightPage />
          );

        case "measurements":
          return (
            <MeasurementsPage />
          );

        case "body-metrics":
          return (
            <BodyMetricsPage />
          );

        case "nutrition":
          return (
            <NutritionPage />
          );

        case "meals":
          return (
            <MealsPage />
          );

        case "meal-history":
          return (
            <MealHistoryPage />
          );

        case "recipes":
          return (
            <RecipesPage />
          );

        case "tasks":
          return (
            <TasksPage />
          );

        case "reminders":
          return (
            <RemindersPage />
          );

        case "progress":
          return (
            <ProgressPage />
          );

        case "settings":
          return (
            <SettingsPage />
          );

        case "dashboard":
        default:
          return (
            <DashboardPage
              onNavigate={
                setActivePage
              }
            />
          );
      }
    }, [activePage]);

  if (
    sessionLoading
  ) {
    return (
      <main className="loading-screen">
        <div className="loading-orb" />
        <strong>
          VYRA
        </strong>
        <span>
          Checking secure
          session...
        </span>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthPage />
    );
  }

  if (
    profilesLoading
  ) {
    return (
      <main className="loading-screen">
        <div className="loading-orb" />
        <strong>
          VYRA
        </strong>
        <span>
          Loading profiles...
        </span>
      </main>
    );
  }

  if (
    profiles.length ===
    0
  ) {
    return (
      <ProfileSetupPage />
    );
  }

  return (
    <AppShell
      activePage={
        activePage
      }
      onNavigate={
        setActivePage
      }
    >
      {globalError && (
        <button
          className="global-error"
          onClick={() =>
            setGlobalError(
              ""
            )
          }
        >
          {globalError}
        </button>
      )}

      <div
        className="page-enter"
        key={
          activePage
        }
      >
        {page}
      </div>
    </AppShell>
  );
}
