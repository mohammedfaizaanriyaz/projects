import { Menu, Plus } from "lucide-react";

export default function TopBar({ profile, onMenu, onLog }) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={onMenu}
        aria-label="Open navigation"
        title="Open navigation"
      >
        <Menu />
      </button>

      <div>
        <span className="eyebrow">HEALTH DASHBOARD</span>

        <h1>
          {profile ? `Welcome, ${profile.profile_name}` : "Weight Tracker"}
          <span className="wave">👋</span>
        </h1>

        <p>Keep showing up. Your progress is being recorded.</p>
      </div>

      <button className="primary-button" onClick={onLog} disabled={!profile}>
        <Plus />
        Log Weight
      </button>
    </header>
  );
}

// ============================================================
// METRIC
// ============================================================
