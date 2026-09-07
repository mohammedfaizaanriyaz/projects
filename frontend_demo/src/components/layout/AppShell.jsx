import {
  useState
} from "react";

import Sidebar
  from "./Sidebar";

import Topbar
  from "./Topbar";

export default function AppShell({
  activePage,
  onNavigate,
  children
}) {
  const [
    mobileOpen,
    setMobileOpen
  ] =
    useState(false);

  return (
    <div className="app-shell">
      <div className="space-texture" />
      <div className="grid-texture" />
      <div className="aurora aurora--one" />
      <div className="aurora aurora--two" />

      <Sidebar
        activePage={
          activePage
        }
        onNavigate={
          onNavigate
        }
        mobileOpen={
          mobileOpen
        }
        onCloseMobile={() =>
          setMobileOpen(
            false
          )
        }
      />

      <main className="main-shell">
        <Topbar
          onOpenMobile={() =>
            setMobileOpen(
              true
            )
          }
          onNavigate={
            onNavigate
          }
        />

        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
