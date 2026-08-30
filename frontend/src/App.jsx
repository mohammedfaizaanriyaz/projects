import { useEffect, useState } from "react";

import WelcomeScreen from "./components/WelcomeScreen";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsGrid from "./components/StatsGrid";
import WeightChart from "./components/WeightChart";
import GoalCard from "./components/GoalCard";
import ProfileCard from "./components/ProfileCard";
import HistoryCard from "./components/HistoryCard";
import ProfileWizard from "./components/ProfileWizard";
import EditProfileModal from "./components/EditProfileModal";
import WeightModal from "./components/WeightModal";
import Loading from "./components/Loading";
import ErrorToast from "./components/ErrorToast";

import {
  calculateBMI,
  feetInchesToCm,
  healthyRange,
  lengthToCm,
  round,
  weightToKg,
} from "./utils/weightUtils";

import "./App.css";

const API = "http://localhost:5000";

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

  function changeWeightUnit(unit) {
    setPreferredWeightUnit(unit);
    localStorage.setItem("weight_unit", unit);
  }

  function changeLengthUnit(unit) {
    setPreferredLengthUnit(unit);
    localStorage.setItem("length_unit", unit);
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

useEffect(() => {
  async function initializeUser() {
    if (!userId) {
      setLoading(false);
      setShowProfileModal(true);
      return;
    }

    const userExists =
      await validateStoredUser(
        userId
      );

    if (!userExists) {
      localStorage.removeItem(
        "weight_tracker_user_id"
      );

      setUserId(null);

      setProfiles([]);
      setSelectedProfileId(null);
      setProfile(null);
      setHistory([]);

      setLoading(false);
      setShowProfileModal(true);

      return;
    }

    await loadProfiles(userId);
  }

  initializeUser();
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
  async function validateStoredUser(id) {
  try {
    await request(
      `/api/users/${id}`
    );

    return true;
  } catch (err) {
    return false;
  }
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
          onClose={() => { }}
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
            <StatsGrid
              currentWeight={currentWeight}
              weightUnit={preferredWeightUnit}
              weightChange={weightChange}
              bmi={bmi}
              bodyFat={bodyFat}
              targetWeight={targetWeight}
              remaining={remaining}
              weightAction={weightAction}
            />

            <section className="dashboard-grid">
              <WeightChart
                history={history}
                weightUnit={preferredWeightUnit}
                onWeightUnitChange={changeWeightUnit}
                targetWeight={targetWeight}
              />

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
                onLengthUnitChange={changeLengthUnit}
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

