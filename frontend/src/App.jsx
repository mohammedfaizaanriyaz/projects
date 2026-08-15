import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  CalendarDays,
  ChevronRight,
  Edit3,
  Goal,
  Home,
  LineChart,
  LogOut,
  Menu,
  Plus,
  Ruler,
  Scale,
  Settings,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import "./App.css";

const API =
  "http://localhost:5000";

// ============================================================
// UNIT HELPERS
// ============================================================

function kgToLb(kg) {
  return kg * 2.2046226218;
}

function lbToKg(lb) {
  return lb / 2.2046226218;
}

function cmToInch(cm) {
  return cm / 2.54;
}

function inchToCm(inch) {
  return inch * 2.54;
}

function round(value, decimals = 2) {
  const power = 10 ** decimals;

  return (
    Math.round(
      Number(value) * power
    ) / power
  );
}

function weightToKg(value, unit) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (unit === "lbs") {
    return round(lbToKg(number));
  }

  return round(number);
}

function lengthToCm(value, unit) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (unit === "inch") {
    return round(inchToCm(number));
  }

  return round(number);
}
function feetInchesToCm(
  feet,
  inches
) {
  const f =
    Number(feet || 0);

  const i =
    Number(inches || 0);

  return round(
    (f * 12 + i) * 2.54
  );
}

function displayWeight(
  kg,
  unit
) {
  if (
    kg === null ||
    kg === undefined
  ) {
    return "—";
  }

  if (unit === "lbs") {
    return `${round(
      kgToLb(Number(kg)),
      1
    )} lbs`;
  }

  return `${round(
    Number(kg),
    1
  )} kg`;
}

function displayLength(
  cm,
  unit
) {
  if (
    cm === null ||
    cm === undefined
  ) {
    return "—";
  }

  if (unit === "inch") {
    return `${round(
      cmToInch(
        Number(cm)
      ),
      1
    )} in`;
  }

  return `${round(
    Number(cm),
    1
  )} cm`;
}

// ============================================================
// DATE HELPERS
// ============================================================

function dateValue(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function formatShortDate(
  value
) {
  const date =
    dateValue(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function formatFullDate(
  value
) {
  const date =
    dateValue(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// CHART FILTER
// ============================================================

function filterHistory(
  history,
  range
) {
  if (range === "ALL") {
    return history;
  }

  const days = {
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
  };

  const cutoff =
    new Date();

  cutoff.setDate(
    cutoff.getDate() -
      days[range]
  );

  return history.filter(
    (entry) => {
      const date =
        dateValue(
          entry.recorded_date
        );

      return (
        date &&
        date >= cutoff
      );
    }
  );
}

// ============================================================
// HEALTH HELPERS
// ============================================================

function calculateBMI(
  weightKg,
  heightCm
) {
  if (
    !weightKg ||
    !heightCm
  ) {
    return null;
  }

  const metres =
    Number(heightCm) /
    100;

  return round(
    Number(weightKg) /
      (metres * metres),
    1
  );
}

function bmiCategory(bmi) {
  if (bmi === null) {
    return "—";
  }

  if (bmi < 18.5) {
    return "Underweight";
  }

  if (bmi < 25) {
    return "Normal";
  }

  if (bmi < 30) {
    return "Overweight";
  }

  return "Obesity";
}

function healthyRange(
  heightCm
) {
  if (!heightCm) {
    return null;
  }

  const height =
    Number(heightCm) /
    100;

  return {
    min: round(
      18.5 *
        height *
        height,
      1
    ),

    max: round(
      24.9 *
        height *
        height,
      1
    ),
  };
}

// ============================================================
// EMPTY PROFILE FORM
// ============================================================

function emptyProfile() {
  return {
    profile_name: "",
    dob: "",
    gender: "",

    heightValue: "",
    heightUnit: "cm",
    heightFeet: "",
    heightInches: "",

    currentWeight: "",
    weightUnit: "kg",

    targetWeight: "",
    targetWeightUnit: "kg",

    waist: "",
    waistUnit: "cm",

    chest: "",
    chestUnit: "cm",

    neck: "",
    neckUnit: "cm",

    hip: "",
    hipUnit: "cm",
  };
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [
    userId,
    setUserId,
  ] = useState(
    () =>
      localStorage.getItem(
        "weight_tracker_user_id"
      )
  );

  const [
    profiles,
    setProfiles,
  ] = useState([]);

  const [
    selectedProfileId,
    setSelectedProfileId,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showProfileModal,
    setShowProfileModal,
  ] = useState(false);

  const [
    showWeightModal,
    setShowWeightModal,
  ] = useState(false);

  const [
    editingProfile,
    setEditingProfile,
  ] = useState(false);

  const [
    range,
    setRange,
  ] = useState("1M");

  const [
    mobileMenu,
    setMobileMenu,
  ] = useState(false);

  const [
    preferredWeightUnit,
    setPreferredWeightUnit,
  ] = useState(
    () =>
      localStorage.getItem(
        "weight_unit"
      ) || "kg"
  );

  const [
    preferredLengthUnit,
    setPreferredLengthUnit,
  ] = useState(
    () =>
      localStorage.getItem(
        "length_unit"
      ) || "cm"
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);

      setShowProfileModal(
        true
      );

      return;
    }

    loadProfiles(userId);
  }, [userId]);

  // ==========================================================
  // LOAD SELECTED PROFILE
  // ==========================================================

  useEffect(() => {
    if (!selectedProfileId) {
      return;
    }

    loadProfile(
      selectedProfileId
    );

    loadHistory(
      selectedProfileId
    );
  }, [
    selectedProfileId,
  ]);

  // ==========================================================
  // API
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {
    const response =
      await fetch(
        `${API}${url}`,
        {
          headers: {
            "Content-Type":
              "application/json",

            ...(options.headers ||
              {}),
          },

          ...options,
        }
      );

    let data;

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Request failed"
      );
    }

    return data;
  }

  async function loadProfiles(
    id
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await request(
          `/api/users/${id}/profiles`
        );

      setProfiles(data);

      if (
        data.length > 0
      ) {
        setSelectedProfileId(
          (current) =>
            current &&
            data.some(
              (item) =>
                item.profile_id ===
                current
            )
              ? current
              : data[0]
                  .profile_id
        );
      } else {
        setSelectedProfileId(
          null
        );

        setProfile(null);

        setHistory([]);
      }
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile(
    id
  ) {
    try {
      const data =
        await request(
          `/api/profiles/${id}`
        );

      setProfile(data);
    } catch (err) {
      setError(
        err.message
      );
    }
  }

  async function loadHistory(
    id
  ) {
    try {
      const data =
        await request(
          `/api/profiles/${id}/weight-records`
        );

      setHistory(data);
    } catch (err) {
      setError(
        err.message
      );
    }
  }

  // ==========================================================
  // CREATE FIRST ACCOUNT / PROFILE
  // ==========================================================

  async function createProfile(
    form
  ) {
    try {
      setError("");

      let ownerId =
        userId;

      if (!ownerId) {
        const owner =
          await request(
            "/api/users",
            {
              method: "POST",

              body: JSON.stringify({
                name:
                  form.profile_name,
              }),
            }
          );

        ownerId =
          owner.user_id;

        localStorage.setItem(
          "weight_tracker_user_id",
          ownerId
        );

        setUserId(ownerId);
      }

      const heightCm =
        form.heightUnit ===
        "ft-in"
          ? feetInchesToCm(
              form.heightFeet,
              form.heightInches
            )
          : lengthToCm(
              form.heightValue,
              form.heightUnit
            );

      const currentWeightKg =
        weightToKg(
          form.currentWeight,
          form.weightUnit
        );

      const targetWeightKg =
        weightToKg(
          form.targetWeight,
          form.targetWeightUnit
        );

      const payload = {
        profile_name:
          form.profile_name,

        dob:
          form.dob,

        gender:
          form.gender,

        height_cm:
          heightCm,

        current_weight_kg:
          currentWeightKg,

        target_weight_kg:
          targetWeightKg,

        waist_cm:
          lengthToCm(
            form.waist,
            form.waistUnit
          ),

        chest_cm:
          lengthToCm(
            form.chest,
            form.chestUnit
          ),

        neck_cm:
          lengthToCm(
            form.neck,
            form.neckUnit
          ),

        hip_cm:
          form.hip
            ? lengthToCm(
                form.hip,
                form.hipUnit
              )
            : null,
      };

      const result =
        await request(
          `/api/users/${ownerId}/profiles`,
          {
            method: "POST",
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      setShowProfileModal(
        false
      );

      await loadProfiles(
        ownerId
      );

      setSelectedProfileId(
        result.profile_id
      );
    } catch (err) {
      setError(
        err.message
      );

      throw err;
    }
  }

  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  async function updateProfile(
    values
  ) {
    try {
      const payload = {
        profile_name:
          values.profile_name,

        dob:
          values.dob,

        gender:
          values.gender,

        height_cm:
          values.height_cm,

        waist_cm:
          values.waist_cm,

        chest_cm:
          values.chest_cm,

        neck_cm:
          values.neck_cm,

        hip_cm:
          values.hip_cm,

        target_weight_kg:
          values.target_weight_kg,
      };

      await request(
        `/api/profiles/${selectedProfileId}`,
        {
          method: "PUT",

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      setEditingProfile(
        false
      );

      await Promise.all([
        loadProfile(
          selectedProfileId
        ),

        loadProfiles(userId),
      ]);
    } catch (err) {
      setError(
        err.message
      );

      throw err;
    }
  }

  // ==========================================================
  // DELETE PROFILE
  // ==========================================================

  async function deleteProfile() {
    if (!profile) {
      return;
    }

    const ok =
      window.confirm(
        `Delete ${profile.profile_name}'s profile and all weight history?`
      );

    if (!ok) {
      return;
    }

    try {
      await request(
        `/api/profiles/${profile.profile_id}`,
        {
          method:
            "DELETE",
        }
      );

      setProfile(null);
      setHistory([]);

      await loadProfiles(
        userId
      );
    } catch (err) {
      setError(
        err.message
      );
    }
  }

  // ==========================================================
  // LOG WEIGHT
  // ==========================================================

  async function saveWeight(
    values
  ) {
    try {
      const payload = {
        weight_kg:
          weightToKg(
            values.weight,
            values.weightUnit
          ),

        recorded_date:
          values.date,

        waist_cm:
          values.waist
            ? lengthToCm(
                values.waist,
                values.lengthUnit
              )
            : undefined,

        chest_cm:
          values.chest
            ? lengthToCm(
                values.chest,
                values.lengthUnit
              )
            : undefined,

        neck_cm:
          values.neck
            ? lengthToCm(
                values.neck,
                values.lengthUnit
              )
            : undefined,

        hip_cm:
          values.hip
            ? lengthToCm(
                values.hip,
                values.lengthUnit
              )
            : undefined,
      };

      await request(
        `/api/profiles/${selectedProfileId}/weight-records`,
        {
          method: "POST",

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      setShowWeightModal(
        false
      );

      await Promise.all([
        loadHistory(
          selectedProfileId
        ),

        loadProfile(
          selectedProfileId
        ),

        loadProfiles(userId),
      ]);
    } catch (err) {
      setError(
        err.message
      );

      throw err;
    }
  }

  // ==========================================================
  // COMPUTED DATA
  // ==========================================================

  const currentRecord =
    history.length > 0
      ? history[
          history.length -
            1
        ]
      : null;

  const previousRecord =
    history.length > 1
      ? history[
          history.length -
            2
        ]
      : null;

  const currentWeight =
    currentRecord
      ? Number(
          currentRecord.weight_kg
        )
      : null;

  const previousWeight =
    previousRecord
      ? Number(
          previousRecord.weight_kg
        )
      : null;

  const weightChange =
    currentWeight !== null &&
    previousWeight !== null
      ? round(
          currentWeight -
            previousWeight,
          1
        )
      : null;

  const bmi =
    currentRecord?.bmi !==
      null &&
    currentRecord?.bmi !==
      undefined
      ? Number(
          currentRecord.bmi
        )
      : profile &&
        currentWeight
      ? calculateBMI(
          currentWeight,
          profile.height_cm
        )
      : null;

  const bodyFat =
    currentRecord
      ?.body_fat_percentage !==
      null &&
    currentRecord
      ?.body_fat_percentage !==
      undefined
      ? Number(
          currentRecord.body_fat_percentage
        )
      : null;

  const targetWeight =
    profile
      ?.target_weight_kg !==
      null &&
    profile
      ?.target_weight_kg !==
      undefined
      ? Number(
          profile.target_weight_kg
        )
      : null;

  const remaining =
    currentWeight !== null &&
    targetWeight !== null
      ? round(
          Math.abs(
            currentWeight -
              targetWeight
          ),
          1
        )
      : null;

  const weightAction =
    currentWeight !== null &&
    targetWeight !== null
      ? currentWeight >
        targetWeight
        ? "to lose"
        : currentWeight <
          targetWeight
        ? "to gain"
        : "goal reached"
      : "";

  const healthy =
    profile
      ? healthyRange(
          profile.height_cm
        )
      : null;

  const filtered =
    useMemo(
      () =>
        filterHistory(
          history,
          range
        ),
      [history, range]
    );

  const chartData =
    filtered.map(
      (item) => ({
        ...item,

        dateLabel:
          formatShortDate(
            item.recorded_date
          ),

        displayWeight:
          preferredWeightUnit ===
          "lbs"
            ? round(
                kgToLb(
                  Number(
                    item.weight_kg
                  )
                ),
                1
              )
            : Number(
                item.weight_kg
              ),
      })
    );

  // ==========================================================
  // FIRST PROFILE SETUP
  // ==========================================================

  if (
    !loading &&
    profiles.length === 0
  ) {
    return (
      <>
        <WelcomeScreen />

        <ProfileWizard
          open={
            showProfileModal
          }
          firstProfile
          onClose={() => {}}
          onSave={
            createProfile
          }
        />

        {error && (
          <ErrorToast
            message={error}
            onClose={() =>
              setError("")
            }
          />
        )}
      </>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="app">
      <Sidebar
        profiles={
          profiles
        }
        selectedId={
          selectedProfileId
        }
        onSelect={(id) => {
          setSelectedProfileId(
            id
          );

          setMobileMenu(
            false
          );
        }}
        onAdd={() =>
          setShowProfileModal(
            true
          )
        }
        open={mobileMenu}
        onClose={() =>
          setMobileMenu(
            false
          )
        }
      />

      <main className="main">
        <TopBar
          profile={profile}
          onMenu={() =>
            setMobileMenu(
              true
            )
          }
          onLog={() =>
            setShowWeightModal(
              true
            )
          }
        />

        {loading ? (
          <Loading />
        ) : (
          <>
            <section className="stats">
              <Metric
                label="Current Weight"
                value={displayWeight(
                  currentWeight,
                  preferredWeightUnit
                )}
                icon={
                  <Scale />
                }
                detail={
                  weightChange ===
                  null
                    ? "No previous entry"
                    : `${
                        weightChange >
                        0
                          ? "+"
                          : ""
                      }${weightChange} kg from last entry`
                }
              />

              <Metric
                label="BMI"
                value={
                  bmi !== null
                    ? bmi.toFixed(
                        1
                      )
                    : "—"
                }
                icon={
                  <Activity />
                }
                detail={bmiCategory(
                  bmi
                )}
              />

              <Metric
                label="Body Fat"
                value={
                  bodyFat !==
                  null
                    ? `${bodyFat.toFixed(
                        1
                      )}%`
                    : "—"
                }
                icon={
                  <Ruler />
                }
                detail={
                  bodyFat === null
                    ? "Add waist & neck measurements"
                    : "Latest estimate"
                }
              />

              <Metric
                label="Goal"
                value={displayWeight(
                  targetWeight,
                  preferredWeightUnit
                )}
                icon={
                  <Target />
                }
                detail={
                  remaining !==
                  null
                    ? weightAction ===
                      "goal reached"
                      ? "Goal reached"
                      : `${displayWeight(
                          remaining,
                          preferredWeightUnit
                        )} ${weightAction}`
                    : "No target set"
                }
              />
            </section>

            <section className="dashboard-grid">
              <div className="card chart-card">
                <div className="card-header">
                  <div>
                    <span className="eyebrow">
                      PROGRESS
                    </span>

                    <h2>
                      Weight
                      History
                    </h2>
                  </div>

                  <div className="chart-controls">
                    {[
                      "7D",
                      "1M",
                      "3M",
                      "6M",
                      "1Y",
                      "ALL",
                    ].map(
                      (
                        item
                      ) => (
                        <button
                          key={
                            item
                          }
                          className={
                            range ===
                            item
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setRange(
                              item
                            )
                          }
                        >
                          {
                            item
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="unit-selector">
                  <button
                    className={
                      preferredWeightUnit ===
                      "kg"
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setPreferredWeightUnit(
                        "kg"
                      );

                      localStorage.setItem(
                        "weight_unit",
                        "kg"
                      );
                    }}
                  >
                    kg
                  </button>

                  <button
                    className={
                      preferredWeightUnit ===
                      "lbs"
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setPreferredWeightUnit(
                        "lbs"
                      );

                      localStorage.setItem(
                        "weight_unit",
                        "lbs"
                      );
                    }}
                  >
                    lbs
                  </button>
                </div>

                <div className="chart">
                  {chartData.length >
                  0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <AreaChart
                        data={
                          chartData
                        }
                        margin={{
                          top: 15,
                          right: 12,
                          bottom: 5,
                          left: -8,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="weightFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#26e6a2"
                              stopOpacity={
                                0.32
                              }
                            />

                            <stop
                              offset="100%"
                              stopColor="#26e6a2"
                              stopOpacity={
                                0
                              }
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="#1d293c"
                          strokeDasharray="4 4"
                          vertical={
                            false
                          }
                        />

                        <XAxis
                          dataKey="dateLabel"
                          stroke="#718096"
                          tick={{
                            fontSize: 11,
                          }}
                          axisLine={
                            false
                          }
                          tickLine={
                            false
                          }
                        />

                        <YAxis
                          dataKey="displayWeight"
                          stroke="#718096"
                          tick={{
                            fontSize: 11,
                          }}
                          axisLine={
                            false
                          }
                          tickLine={
                            false
                          }
                          domain={[
                            "dataMin - 2",
                            "dataMax + 2",
                          ]}
                        />

                        <Tooltip
                          content={
                            <WeightTooltip
                              unit={
                                preferredWeightUnit
                              }
                            />
                          }
                        />

                        {targetWeight !==
                          null && (
                          <ReferenceLine
                            y={
                              preferredWeightUnit ===
                              "lbs"
                                ? kgToLb(
                                    targetWeight
                                  )
                                : targetWeight
                            }
                            stroke="#866cff"
                            strokeDasharray="6 6"
                            label={{
                              value:
                                "Goal",
                              fill: "#a999ff",
                              fontSize: 11,
                            }}
                          />
                        )}

                        <Area
                          type="monotone"
                          dataKey="displayWeight"
                          stroke="#26e6a2"
                          strokeWidth={
                            3
                          }
                          fill="url(#weightFill)"
                          dot={{
                            r: 4,
                            fill: "#26e6a2",
                            stroke:
                              "#09120f",
                            strokeWidth:
                              2,
                          }}
                          activeDot={{
                            r: 6,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </div>
              </div>

              <GoalCard
                currentWeight={
                  currentWeight
                }
                targetWeight={
                  targetWeight
                }
                remaining={
                  remaining
                }
                healthy={
                  healthy
                }
                unit={
                  preferredWeightUnit
                }
              />
            </section>

            <section className="bottom-grid">
              <ProfileCard
                profile={
                  profile
                }
                lengthUnit={
                  preferredLengthUnit
                }
                onLengthUnitChange={(
                  unit
                ) => {
                  setPreferredLengthUnit(
                    unit
                  );

                  localStorage.setItem(
                    "length_unit",
                    unit
                  );
                }}
                onEdit={() =>
                  setEditingProfile(
                    true
                  )
                }
                onDelete={
                  deleteProfile
                }
              />

              <HistoryCard
                history={
                  history
                }
                weightUnit={
                  preferredWeightUnit
                }
                onLog={() =>
                  setShowWeightModal(
                    true
                  )
                }
              />
            </section>
          </>
        )}
      </main>

      <ProfileWizard
        open={
          showProfileModal
        }
        onClose={() =>
          setShowProfileModal(
            false
          )
        }
        onSave={
          createProfile
        }
      />

      {editingProfile &&
        profile && (
          <EditProfileModal
            profile={
              profile
            }
            onClose={() =>
              setEditingProfile(
                false
              )
            }
            onSave={
              updateProfile
            }
          />
        )}

      <WeightModal
        open={
          showWeightModal
        }
        profile={
          profile
        }
        weightUnit={
          preferredWeightUnit
        }
        lengthUnit={
          preferredLengthUnit
        }
        onClose={() =>
          setShowWeightModal(
            false
          )
        }
        onSave={
          saveWeight
        }
      />

      {error && (
        <ErrorToast
          message={error}
          onClose={() =>
            setError("")
          }
        />
      )}
    </div>
  );
}

// ============================================================
// WELCOME
// ============================================================

function WelcomeScreen() {
  return (
    <div className="welcome">
      <div className="welcome-glow glow-left" />
      <div className="welcome-glow glow-right" />

      <div className="welcome-brand">
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
            Track • Improve •
            Achieve
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({
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

function TopBar({
  profile,
  onMenu,
  onLog,
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={onMenu}
      >
        <Menu />
      </button>

      <div>
        <span className="eyebrow">
          HEALTH DASHBOARD
        </span>

        <h1>
          {profile
            ? `Welcome, ${profile.profile_name}`
            : "Weight Tracker"}
          <span className="wave">
            👋
          </span>
        </h1>

        <p>
          Keep showing up.
          Your progress is
          being recorded.
        </p>
      </div>

      <button
        className="primary-button"
        onClick={onLog}
        disabled={!profile}
      >
        <Plus />
        Log Weight
      </button>
    </header>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
  detail,
  icon,
}) {
  return (
    <article className="metric">
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>
      </div>
    </article>
  );
}

// ============================================================
// GOAL CARD
// ============================================================

function GoalCard({
  currentWeight,
  targetWeight,
  remaining,
  healthy,
  unit,
}) {
  let percentage = 0;

  if (
    currentWeight &&
    targetWeight
  ) {
    const difference =
      Math.abs(
        currentWeight -
          targetWeight
      );

    percentage =
      Math.max(
        0,
        Math.min(
          100,
          100 -
            difference *
              8
        )
      );
  }

  return (
    <article className="card goal-card">
      <div className="goal-icon">
        <Goal />
      </div>

      <span className="eyebrow">
        YOUR GOAL
      </span>

      <h2>
        {displayWeight(
          targetWeight,
          unit
        )}
      </h2>

      <p>
        {remaining !== null
          ? `${displayWeight(
              remaining,
              unit
            )} remaining`
          : "Set a goal to track progress"}
      </p>

      <div className="progress-ring">
        <svg
          viewBox="0 0 130 130"
        >
          <circle
            cx="65"
            cy="65"
            r="52"
            className="ring-track"
          />

          <circle
            cx="65"
            cy="65"
            r="52"
            className="ring-progress"
            style={{
              strokeDashoffset:
                327 -
                (327 *
                  percentage) /
                  100,
            }}
          />
        </svg>

        <div>
          <strong>
            {Math.round(
              percentage
            )}
            %
          </strong>

          <span>
            progress
          </span>
        </div>
      </div>

      {healthy && (
        <div className="healthy-box">
          <span>
            General healthy BMI
            weight range
          </span>

          <strong>
            {displayWeight(
              healthy.min,
              unit
            )}
            {" – "}
            {displayWeight(
              healthy.max,
              unit
            )}
          </strong>
        </div>
      )}

      <small className="health-note">
        This range is a
        general BMI reference,
        not an appearance
        standard.
      </small>
    </article>
  );
}

// ============================================================
// PROFILE CARD
// ============================================================

function ProfileCard({
  profile,
  lengthUnit,
  onLengthUnitChange,
  onEdit,
  onDelete,
}) {
  if (!profile) {
    return null;
  }

  return (
    <article className="card">
      <div className="card-header">
        <div>
          <span className="eyebrow">
            BODY PROFILE
          </span>

          <h2>
            Personal Details
          </h2>
        </div>

        <div className="card-actions">
          <button
            onClick={
              onEdit
            }
          >
            <Edit3 />
          </button>

          <button
            className="danger"
            onClick={
              onDelete
            }
          >
            <Trash2 />
          </button>
        </div>
      </div>

      <div className="unit-selector detail-unit">
        <button
          className={
            lengthUnit ===
            "cm"
              ? "selected"
              : ""
          }
          onClick={() =>
            onLengthUnitChange(
              "cm"
            )
          }
        >
          cm
        </button>

        <button
          className={
            lengthUnit ===
            "inch"
              ? "selected"
              : ""
          }
          onClick={() =>
            onLengthUnitChange(
              "inch"
            )
          }
        >
          inch
        </button>
      </div>

      <div className="details-grid">
        <Detail
          name="Name"
          value={
            profile.profile_name
          }
        />

        <Detail
          name="DOB"
          value={formatFullDate(
            profile.dob
          )}
        />

        <Detail
          name="Gender"
          value={
            profile.gender
          }
        />

        <Detail
          name="Height"
          value={displayLength(
            profile.height_cm,
            lengthUnit
          )}
        />

        <Detail
          name="Waist"
          value={displayLength(
            profile.waist_cm,
            lengthUnit
          )}
        />

        <Detail
          name="Chest"
          value={displayLength(
            profile.chest_cm,
            lengthUnit
          )}
        />

        <Detail
          name="Neck"
          value={displayLength(
            profile.neck_cm,
            lengthUnit
          )}
        />

        <Detail
          name="Hip"
          value={displayLength(
            profile.hip_cm,
            lengthUnit
          )}
        />
      </div>
    </article>
  );
}

function Detail({
  name,
  value,
}) {
  return (
    <div className="detail">
      <span>
        {name}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

// ============================================================
// HISTORY
// ============================================================

function HistoryCard({
  history,
  weightUnit,
  onLog,
}) {
  const recent =
    [...history]
      .reverse()
      .slice(0, 6);

  return (
    <article className="card history-card">
      <div className="card-header">
        <div>
          <span className="eyebrow">
            RECENT
          </span>

          <h2>
            Weight Entries
          </h2>
        </div>

        <CalendarDays />
      </div>

      {recent.length ===
      0 ? (
        <div className="empty-history">
          <Scale />

          <p>
            No weight records
            yet.
          </p>

          <button
            className="secondary-button"
            onClick={
              onLog
            }
          >
            Log first weight
          </button>
        </div>
      ) : (
        <div className="history-list">
          {recent.map(
            (entry) => (
              <div
                className="history-row"
                key={
                  entry.weight_id
                }
              >
                <div>
                  <strong>
                    {displayWeight(
                      Number(
                        entry.weight_kg
                      ),
                      weightUnit
                    )}
                  </strong>

                  <span>
                    {formatFullDate(
                      entry.recorded_date
                    )}
                  </span>
                </div>

                <div className="history-health">
                  <span>
                    BMI
                  </span>

                  <strong>
                    {entry.bmi
                      ? Number(
                          entry.bmi
                        ).toFixed(
                          1
                        )
                      : "—"}
                  </strong>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </article>
  );
}

// ============================================================
// PROFILE WIZARD
// ============================================================

function ProfileWizard({
  open,
  onClose,
  onSave,
  firstProfile = false,
}) {
  const [
    step,
    setStep,
  ] = useState(1);

  const [
    form,
    setForm,
  ] = useState(
    emptyProfile()
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  if (!open) {
    return null;
  }

  function change(
    name,
    value
  ) {
    setForm(
      (old) => ({
        ...old,
        [name]:
          value,
      })
    );
  }

  async function submit() {
    try {
      setSaving(true);

      await onSave(form);

      setForm(
        emptyProfile()
      );

      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  const previewHeight =
    form.heightUnit ===
    "ft-in"
      ? feetInchesToCm(
          form.heightFeet,
          form.heightInches
        )
      : lengthToCm(
          form.heightValue,
          form.heightUnit
        );

  const previewWeight =
    weightToKg(
      form.currentWeight,
      form.weightUnit
    );

  const previewBMI =
    calculateBMI(
      previewWeight,
      previewHeight
    );

  const previewHealthy =
    healthyRange(
      previewHeight
    );

  return (
    <div className="modal-overlay wizard-overlay">
      <div className="wizard">
        {!firstProfile && (
          <button
            className="close-button"
            onClick={
              onClose
            }
          >
            <X />
          </button>
        )}

        <div className="wizard-brand">
          <div className="brand-icon">
            <Activity />
          </div>

          <div>
            <span className="eyebrow">
              {firstProfile
                ? "WELCOME TO WEIGHTTRACK"
                : "NEW PROFILE"}
            </span>

            <h1>
              {step === 1
                ? "Tell us about yourself"
                : step ===
                  2
                ? "Body measurements"
                : "Set your goal"}
            </h1>
          </div>
        </div>

        <div className="steps">
          <WizardStep
            number={1}
            label="Personal"
            active={
              step >= 1
            }
          />

          <div
            className={`step-line ${
              step >= 2
                ? "active"
                : ""
            }`}
          />

          <WizardStep
            number={2}
            label="Body"
            active={
              step >= 2
            }
          />

          <div
            className={`step-line ${
              step >= 3
                ? "active"
                : ""
            }`}
          />

          <WizardStep
            number={3}
            label="Goal"
            active={
              step >= 3
            }
          />
        </div>

        {step === 1 && (
          <div className="form-grid">
            <Field
              label="Name"
              value={
                form.profile_name
              }
              onChange={(
                value
              ) =>
                change(
                  "profile_name",
                  value
                )
              }
              placeholder="Enter name"
            />

            <Field
              label="Date of Birth"
              type="date"
              value={
                form.dob
              }
              onChange={(
                value
              ) =>
                change(
                  "dob",
                  value
                )
              }
            />

            <SelectField
              label="Gender"
              value={
                form.gender
              }
              onChange={(
                value
              ) =>
                change(
                  "gender",
                  value
                )
              }
              options={[
                [
                  "",
                  "Select gender",
                ],
                [
                  "male",
                  "Male",
                ],
                [
                  "female",
                  "Female",
                ],
              ]}
            />

            <HeightField
              form={form}
              change={
                change
              }
            />
          </div>
        )}

        {step === 2 && (
          <div className="form-grid">
            <MeasurementField
              label="Current Weight"
              value={
                form.currentWeight
              }
              unit={
                form.weightUnit
              }
              units={[
                "kg",
                "lbs",
              ]}
              onValue={(
                value
              ) =>
                change(
                  "currentWeight",
                  value
                )
              }
              onUnit={(
                value
              ) =>
                change(
                  "weightUnit",
                  value
                )
              }
            />

            <MeasurementField
              label="Waist"
              value={
                form.waist
              }
              unit={
                form.waistUnit
              }
              units={[
                "cm",
                "inch",
              ]}
              onValue={(
                value
              ) =>
                change(
                  "waist",
                  value
                )
              }
              onUnit={(
                value
              ) =>
                change(
                  "waistUnit",
                  value
                )
              }
            />

            <MeasurementField
              label="Chest"
              value={
                form.chest
              }
              unit={
                form.chestUnit
              }
              units={[
                "cm",
                "inch",
              ]}
              onValue={(
                value
              ) =>
                change(
                  "chest",
                  value
                )
              }
              onUnit={(
                value
              ) =>
                change(
                  "chestUnit",
                  value
                )
              }
            />

            <MeasurementField
              label="Neck"
              value={
                form.neck
              }
              unit={
                form.neckUnit
              }
              units={[
                "cm",
                "inch",
              ]}
              onValue={(
                value
              ) =>
                change(
                  "neck",
                  value
                )
              }
              onUnit={(
                value
              ) =>
                change(
                  "neckUnit",
                  value
                )
              }
            />

            <MeasurementField
              label="Hip"
              value={
                form.hip
              }
              unit={
                form.hipUnit
              }
              units={[
                "cm",
                "inch",
              ]}
              onValue={(
                value
              ) =>
                change(
                  "hip",
                  value
                )
              }
              onUnit={(
                value
              ) =>
                change(
                  "hipUnit",
                  value
                )
              }
              optional
            />
          </div>
        )}

        {step === 3 && (
          <>
            <div className="preview-grid">
              <div className="preview-card">
                <span>
                  BMI
                </span>

                <strong>
                  {previewBMI
                    ? previewBMI.toFixed(
                        1
                      )
                    : "—"}
                </strong>

                <small>
                  {bmiCategory(
                    previewBMI
                  )}
                </small>
              </div>

              <div className="preview-card">
                <span>
                  General Healthy
                  Range
                </span>

                <strong>
                  {previewHealthy
                    ? `${previewHealthy.min} – ${previewHealthy.max} kg`
                    : "—"}
                </strong>

                <small>
                  BMI 18.5–24.9
                </small>
              </div>
            </div>

            <div className="goal-input">
              <MeasurementField
                label="Target Weight"
                value={
                  form.targetWeight
                }
                unit={
                  form.targetWeightUnit
                }
                units={[
                  "kg",
                  "lbs",
                ]}
                onValue={(
                  value
                ) =>
                  change(
                    "targetWeight",
                    value
                  )
                }
                onUnit={(
                  value
                ) =>
                  change(
                    "targetWeightUnit",
                    value
                  )
                }
              />
            </div>

            <div className="goal-message">
              <Target />

              <div>
                <strong>
                  Choose a
                  realistic,
                  sustainable
                  target.
                </strong>

                <p>
                  The app shows a
                  general BMI-based
                  range as a health
                  reference rather
                  than deciding a
                  weight at which
                  someone will
                  “look good.”
                </p>
              </div>
            </div>
          </>
        )}

        <div className="wizard-actions">
          {step > 1 && (
            <button
              className="secondary-button"
              onClick={() =>
                setStep(
                  step - 1
                )
              }
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              className="primary-button"
              onClick={() =>
                setStep(
                  step + 1
                )
              }
            >
              Continue
              <ChevronRight />
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={
                submit
              }
              disabled={
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Create Profile"}

              {!saving && (
                <ChevronRight />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardStep({
  number,
  label,
  active,
}) {
  return (
    <div
      className={`wizard-step ${
        active
          ? "active"
          : ""
      }`}
    >
      <div>
        {number}
      </div>

      <span>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// EDIT PROFILE
// ============================================================

function EditProfileModal({
  profile,
  onClose,
  onSave,
}) {
  const [
    form,
    setForm,
  ] = useState({
    profile_name:
      profile.profile_name ||
      "",

    dob:
      profile.dob
        ? String(
            profile.dob
          ).slice(0, 10)
        : "",

    gender:
      profile.gender || "",

    height_cm:
      profile.height_cm ||
      "",

    waist_cm:
      profile.waist_cm ||
      "",

    chest_cm:
      profile.chest_cm ||
      "",

    neck_cm:
      profile.neck_cm ||
      "",

    hip_cm:
      profile.hip_cm ||
      "",

    target_weight_kg:
      profile.target_weight_kg ||
      "",
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  function update(
    name,
    value
  ) {
    setForm(
      (old) => ({
        ...old,
        [name]:
          value,
      })
    );
  }

  async function save() {
    try {
      setSaving(true);

      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="form-grid">
        <Field
          label="Name"
          value={
            form.profile_name
          }
          onChange={(
            value
          ) =>
            update(
              "profile_name",
              value
            )
          }
        />

        <Field
          label="DOB"
          type="date"
          value={
            form.dob
          }
          onChange={(
            value
          ) =>
            update(
              "dob",
              value
            )
          }
        />

        <SelectField
          label="Gender"
          value={
            form.gender
          }
          onChange={(
            value
          ) =>
            update(
              "gender",
              value
            )
          }
          options={[
            [
              "male",
              "Male",
            ],
            [
              "female",
              "Female",
            ],
          ]}
        />

        <Field
          label="Height (cm)"
          type="number"
          value={
            form.height_cm
          }
          onChange={(
            value
          ) =>
            update(
              "height_cm",
              value
            )
          }
        />

        <Field
          label="Waist (cm)"
          type="number"
          value={
            form.waist_cm
          }
          onChange={(
            value
          ) =>
            update(
              "waist_cm",
              value
            )
          }
        />

        <Field
          label="Chest (cm)"
          type="number"
          value={
            form.chest_cm
          }
          onChange={(
            value
          ) =>
            update(
              "chest_cm",
              value
            )
          }
        />

        <Field
          label="Neck (cm)"
          type="number"
          value={
            form.neck_cm
          }
          onChange={(
            value
          ) =>
            update(
              "neck_cm",
              value
            )
          }
        />

        <Field
          label="Hip (cm)"
          type="number"
          value={
            form.hip_cm
          }
          onChange={(
            value
          ) =>
            update(
              "hip_cm",
              value
            )
          }
        />

        <Field
          label="Target Weight (kg)"
          type="number"
          value={
            form.target_weight_kg
          }
          onChange={(
            value
          ) =>
            update(
              "target_weight_kg",
              value
            )
          }
        />
      </div>

      <button
        className="primary-button modal-save"
        onClick={
          save
        }
        disabled={
          saving
        }
      >
        {saving
          ? "Saving..."
          : "Save Changes"}
      </button>
    </Modal>
  );
}

// ============================================================
// LOG WEIGHT MODAL
// ============================================================

function WeightModal({
  open,
  profile,
  weightUnit,
  lengthUnit,
  onClose,
  onSave,
}) {
  const [
    values,
    setValues,
  ] = useState({
    weight: "",
    weightUnit:
      weightUnit,

    date:
      new Date()
        .toISOString()
        .slice(0, 10),

    waist: "",
    chest: "",
    neck: "",
    hip: "",

    lengthUnit:
      lengthUnit,
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    setValues(
      (old) => ({
        ...old,
        weightUnit,
        lengthUnit,
      })
    );
  }, [
    weightUnit,
    lengthUnit,
  ]);

  if (!open) {
    return null;
  }

  function change(
    name,
    value
  ) {
    setValues(
      (old) => ({
        ...old,
        [name]:
          value,
      })
    );
  }

  async function submit() {
    try {
      setSaving(true);

      await onSave(
        values
      );

      setValues(
        (old) => ({
          ...old,
          weight: "",
          waist: "",
          chest: "",
          neck: "",
          hip: "",
        })
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Log Weight${
        profile
          ? ` — ${profile.profile_name}`
          : ""
      }`}
      onClose={
        onClose
      }
    >
      <MeasurementField
        label="Weight"
        value={
          values.weight
        }
        unit={
          values.weightUnit
        }
        units={[
          "kg",
          "lbs",
        ]}
        onValue={(
          value
        ) =>
          change(
            "weight",
            value
          )
        }
        onUnit={(
          value
        ) =>
          change(
            "weightUnit",
            value
          )
        }
      />

      <Field
        label="Date"
        type="date"
        value={
          values.date
        }
        onChange={(
          value
        ) =>
          change(
            "date",
            value
          )
        }
      />

      <div className="optional-title">
        Optional body
        measurements
      </div>

      <SelectField
        label="Measurement Unit"
        value={
          values.lengthUnit
        }
        onChange={(
          value
        ) =>
          change(
            "lengthUnit",
            value
          )
        }
        options={[
          [
            "cm",
            "Centimetres",
          ],
          [
            "inch",
            "Inches",
          ],
        ]}
      />

      <div className="form-grid">
        <Field
          label="Waist"
          type="number"
          value={
            values.waist
          }
          onChange={(
            value
          ) =>
            change(
              "waist",
              value
            )
          }
        />

        <Field
          label="Chest"
          type="number"
          value={
            values.chest
          }
          onChange={(
            value
          ) =>
            change(
              "chest",
              value
            )
          }
        />

        <Field
          label="Neck"
          type="number"
          value={
            values.neck
          }
          onChange={(
            value
          ) =>
            change(
              "neck",
              value
            )
          }
        />

        <Field
          label="Hip"
          type="number"
          value={
            values.hip
          }
          onChange={(
            value
          ) =>
            change(
              "hip",
              value
            )
          }
        />
      </div>

      <button
        className="primary-button modal-save"
        onClick={
          submit
        }
        disabled={
          saving ||
          !values.weight
        }
      >
        <Scale />

        {saving
          ? "Saving..."
          : "Save Weight"}
      </button>
    </Modal>
  );
}

// ============================================================
// GENERIC FORM COMPONENTS
// ============================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        type={type}
        value={
          value ?? ""
        }
        placeholder={
          placeholder
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      >
        {options.map(
          ([
            optionValue,
            label,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function MeasurementField({
  label,
  value,
  unit,
  units,
  onValue,
  onUnit,
  optional,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {optional && (
          <small>
            {" "}
            (optional)
          </small>
        )}
      </span>

      <div className="measurement-input">
        <input
          type="number"
          step="0.1"
          value={
            value
          }
          onChange={(e) =>
            onValue(
              e.target.value
            )
          }
        />

        <select
          value={
            unit
          }
          onChange={(e) =>
            onUnit(
              e.target.value
            )
          }
        >
          {units.map(
            (item) => (
              <option
                key={
                  item
                }
                value={
                  item
                }
              >
                {item}
              </option>
            )
          )}
        </select>
      </div>
    </label>
  );
}

function HeightField({
  form,
  change,
}) {
  return (
    <label className="field">
      <span>
        Height
      </span>

      <div className="height-wrap">
        {form.heightUnit ===
        "ft-in" ? (
          <>
            <input
              type="number"
              placeholder="ft"
              value={
                form.heightFeet
              }
              onChange={(e) =>
                change(
                  "heightFeet",
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="in"
              value={
                form.heightInches
              }
              onChange={(e) =>
                change(
                  "heightInches",
                  e.target.value
                )
              }
            />
          </>
        ) : (
          <input
            type="number"
            step="0.1"
            value={
              form.heightValue
            }
            onChange={(e) =>
              change(
                "heightValue",
                e.target.value
              )
            }
          />
        )}

        <select
          value={
            form.heightUnit
          }
          onChange={(e) =>
            change(
              "heightUnit",
              e.target.value
            )
          }
        >
          <option value="cm">
            cm
          </option>

          <option value="inch">
            inch
          </option>

          <option value="ft-in">
            ft / in
          </option>
        </select>
      </div>
    </label>
  );
}

// ============================================================
// MODAL
// ============================================================

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={
        onClose
      }
    >
      <div
        className="modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h2>
            {title}
          </h2>

          <button
            onClick={
              onClose
            }
          >
            <X />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

// ============================================================
// CHART TOOLTIP
// ============================================================

function WeightTooltip({
  active,
  payload,
  unit,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const record =
    payload[0].payload;

  return (
    <div className="chart-tooltip">
      <span>
        {formatFullDate(
          record.recorded_date
        )}
      </span>

      <strong>
        {round(
          payload[0].value,
          1
        )}{" "}
        {unit}
      </strong>

      {record.bmi && (
        <small>
          BMI{" "}
          {Number(
            record.bmi
          ).toFixed(1)}
        </small>
      )}
    </div>
  );
}

// ============================================================
// EMPTY / LOADING
// ============================================================

function EmptyChart() {
  return (
    <div className="empty-chart">
      <LineChart />

      <h3>
        No entries in this
        period
      </h3>

      <p>
        Add weight records or
        select ALL to view your
        complete history.
      </p>
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />

      <span>
        Loading your health
        data...
      </span>
    </div>
  );
}

function ErrorToast({
  message,
  onClose,
}) {
  return (
    <div className="error-toast">
      <div>
        <strong>
          Something went wrong
        </strong>

        <span>
          {message}
        </span>
      </div>

      <button
        onClick={
          onClose
        }
      >
        <X />
      </button>
    </div>
  );
}