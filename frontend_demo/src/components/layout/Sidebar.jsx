import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  X
} from "lucide-react";

import {
  useState
} from "react";

import {
  NAVIGATION
} from "../../config/navigation";

import {
  useApp
} from "../../context/AppContext";

export default function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile
}) {
  const {
    user,
    profiles,
    selectedProfileId,
    selectProfile,
    logout
  } =
    useApp();

  const [
    openGroups,
    setOpenGroups
  ] =
    useState({
      Health: true,
      Nutrition: true
    });

  function navigate(
    page
  ) {
    onNavigate(page);
    onCloseMobile();
  }

  return (
    <>
      <button
        aria-label="Close menu"
        className={`sidebar-backdrop ${
          mobileOpen
            ? "is-visible"
            : ""
        }`}
        onClick={
          onCloseMobile
        }
      />

      <aside
        className={`sidebar ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand__mark">
            <Sparkles
              size={19}
            />
          </div>

          <div>
            <strong>VYRA</strong>
            <span>HEALTH OS</span>
          </div>

          <button
            className="sidebar__close"
            onClick={
              onCloseMobile
            }
          >
            <X size={18} />
          </button>
        </div>

        {profiles.length >
          0 && (
          <select
            className="profile-switcher"
            value={
              selectedProfileId ||
              ""
            }
            onChange={(
              event
            ) =>
              selectProfile(
                Number(
                  event.target
                    .value
                )
              )
            }
          >
            {profiles.map(
              (profile) => (
                <option
                  key={
                    profile.profile_id
                  }
                  value={
                    profile.profile_id
                  }
                >
                  {
                    profile.profile_name
                  }
                </option>
              )
            )}
          </select>
        )}

        <nav className="nav">
          {NAVIGATION.map(
            (item) => {
              const Icon =
                item.icon;

              if (
                item.children
              ) {
                const open =
                  openGroups[
                    item.label
                  ];

                const childActive =
                  item.children.some(
                    (child) =>
                      child.page ===
                      activePage
                  );

                return (
                  <div
                    key={
                      item.label
                    }
                  >
                    <button
                      className={`nav-item ${
                        childActive
                          ? "is-parent-active"
                          : ""
                      }`}
                      onClick={() =>
                        setOpenGroups(
                          (
                            current
                          ) => ({
                            ...current,
                            [item.label]:
                              !current[
                                item
                                  .label
                              ]
                          })
                        )
                      }
                    >
                      <Icon
                        size={17}
                      />

                      <span>
                        {
                          item.label
                        }
                      </span>

                      {open ? (
                        <ChevronDown
                          size={15}
                        />
                      ) : (
                        <ChevronRight
                          size={15}
                        />
                      )}
                    </button>

                    {open && (
                      <div className="nav-submenu">
                        {item.children.map(
                          (
                            child
                          ) => {
                            const ChildIcon =
                              child.icon;

                            return (
                              <button
                                key={
                                  child.page
                                }
                                className={`nav-subitem ${
                                  child.page ===
                                  activePage
                                    ? "is-active"
                                    : ""
                                }`}
                                onClick={() =>
                                  navigate(
                                    child.page
                                  )
                                }
                              >
                                <ChildIcon
                                  size={
                                    14
                                  }
                                />
                                {
                                  child.label
                                }
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={
                    item.page
                  }
                  className={`nav-item ${
                    item.page ===
                    activePage
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    navigate(
                      item.page
                    )
                  }
                >
                  <Icon
                    size={17}
                  />
                  <span>
                    {
                      item.label
                    }
                  </span>
                </button>
              );
            }
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="avatar">
            {user?.name
              ?.slice(0, 1)
              .toUpperCase() ||
              "V"}
          </div>

          <div className="sidebar__user">
            <strong>
              {user?.name}
            </strong>
            <span>
              {user?.email}
            </span>
          </div>

          <button
            className="icon-button"
            onClick={
              logout
            }
            title="Logout"
          >
            <LogOut
              size={16}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
