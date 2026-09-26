import {
  Bell,
  Menu,
  Search
} from "lucide-react";

export default function Topbar({
  onOpenMobile,
  onNavigate
}) {
  return (
    <div className="topbar">
      <button
        className="icon-button mobile-menu-button"
        onClick={
          onOpenMobile
        }
      >
        <Menu size={19} />
      </button>

      <button
        className="command-search"
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
