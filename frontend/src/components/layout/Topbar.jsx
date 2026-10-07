import {
  Bell,
  Menu,
  Search
} from "lucide-react";

export default function Topbar({
  onOpenMobile,
  onNavigate,
  mobileOpen,
  opener
}) {
  return (
    <div className="topbar">
      <button
        ref={opener}
        aria-label="Open navigation"
        aria-controls="app-sidebar"
        aria-expanded={mobileOpen}
        className="icon-button mobile-menu-button"
        onClick={
          onOpenMobile
        }
      >
        <Menu size={19} />
      </button>

      <button
        className="command-search"
        aria-label="Search nutrition"
        onClick={() =>
          onNavigate(
            "nutrition"
          )
        }
      >
        <Search size={16} />
        <span>
          Search nutrition...
        </span>
      </button>

      <button
        aria-label="Open reminders"
        className="icon-button topbar-bell"
        onClick={() =>
          onNavigate(
            "reminders"
          )
        }
      >
        <Bell size={18} />
      </button>
    </div>
  );
}
