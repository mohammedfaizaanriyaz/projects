import { Activity, ChevronRight, Home, LineChart, Settings, UserPlus } from "lucide-react";
import { round } from "../utils/weightUtils";

export default function Sidebar({
  profiles,
  selectedId,
  onSelect,
  onAdd,
  open,
  onClose,
}) {
  return (
    <>
      {open && (
        <div
          className="mobile-overlay"
          onClick={
            onClose
          }
        />
      )}

      <aside
        className={`sidebar ${
          open
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Activity />
          </div>

          <div>
            <h1>
              Weight
              <span>
                Track
              </span>
            </h1>

            <p>
              Health Dashboard
            </p>
          </div>
        </div>

        <div className="nav-heading">
          OVERVIEW
        </div>

        <button className="nav-item active">
          <Home />
          Dashboard
        </button>

        <button className="nav-item">
          <LineChart />
          Progress
        </button>

        <div className="nav-heading profile-heading">
          PROFILES
        </div>

        <div className="profile-list">
          {profiles.map(
            (item) => (
              <button
                key={
                  item.profile_id
                }
                onClick={() =>
                  onSelect(
                    item.profile_id
                  )
                }
                className={`profile-item ${
                  selectedId ===
                  item.profile_id
                    ? "active"
                    : ""
                }`}
              >
                <div className="profile-avatar">
                  {item.profile_name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {
                      item.profile_name
                    }
                  </strong>

                  <span>
                    {item.current_weight_kg
                      ? `${round(
                          item.current_weight_kg,
                          1
                        )} kg`
                      : "No weight yet"}
                  </span>
                </div>

                <ChevronRight />
              </button>
            )
          )}
        </div>

        <button
          className="add-profile"
          onClick={
            onAdd
          }
        >
          <UserPlus />
          Add Profile
        </button>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// TOP BAR
// ============================================================

