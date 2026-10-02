import { Plus, Trash2, UserRound } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;

const ACTIVITIES = [
  ["not_specified", "Not specified"],
  ["sedentary", "Sedentary"],
  ["lightly_active", "Lightly active"],
  ["moderately_active", "Moderately active"],
  ["very_active", "Very active"],
  ["extra_active", "Extra active"],
];

function emptyForm(weightUnit, lengthUnit) {
  return {
    profile_name: "",
    dob: "",
    gender: "",
    height_cm: "",
    current_weight_kg: "",
    activity_level: "not_specified",
    weightUnit,
    lengthUnit,
  };
}

function toStoredMeasurement(value, factor, label, optional = false) {
  if (value.trim() === "") {
    if (optional) return null;
    throw new Error(`${label} is required.`);
  }

  const entered = Number(value);

  if (!Number.isFinite(entered) || entered <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  const converted = entered * factor;
  const rounded = Number(converted.toFixed(2));

  if (
    !Number.isFinite(converted) ||
    converted > 999.99 ||
    rounded < 0.01 ||
    rounded > 999.99
  ) {
    throw new Error(`${label} is outside the supported storage range.`);
  }

  return rounded;
}

function displayWeight(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "No current weight";
  }

  const kilograms = Number(value);

  if (!Number.isFinite(kilograms) || kilograms <= 0) {
    return "No current weight";
  }

  const displayed = unit === "lb" ? kilograms / KG_PER_POUND : kilograms;

  return `${displayed.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

export default function ProfilesPage() {
  const { user } = useApp();

  if (!user?.user_id) {
    return (
      <GlassCard>
        <p>Please log in to manage profiles.</p>
      </GlassCard>
    );
  }

  return <ProfilesWorkspace key={user.user_id} />;
}

function ProfilesWorkspace() {
  const {
    profiles,
    profilesLoading,
    selectedProfileId,
    selectProfile,
    createProfile,
    deleteSelectedProfile,
    weightUnit,
    lengthUnit,
  } = useApp();

  const preferredWeightUnit = weightUnit === "lb" ? "lb" : "kg";
  const preferredLengthUnit = lengthUnit === "in" ? "in" : "cm";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() =>
    emptyForm(preferredWeightUnit, preferredLengthUnit),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const locked = useRef(false);
  const lifecycle = useRef(0);

  useLayoutEffect(() => {
    lifecycle.current += 1;

    return () => {
      lifecycle.current += 1;
      locked.current = false;
    };
  }, []);

  const disabled = Boolean(busy) || profilesLoading;

  function update(field, value) {
    if (locked.current) return;

    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function toggleForm() {
    if (locked.current || profilesLoading) return;

    setError("");

    if (!showForm) {
      setForm(emptyForm(preferredWeightUnit, preferredLengthUnit));
    }

    setShowForm((current) => !current);
  }

  async function submit(event) {
    event.preventDefault();
    if (locked.current || profilesLoading) return;

    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;

    locked.current = true;
    setBusy("create");
    setError("");

    try {
      const name = form.profile_name.trim();

      if (!name || Array.from(name).length > 100) {
        throw new Error("Profile name must contain 1 to 100 characters.");
      }

      const height = toStoredMeasurement(
        form.height_cm,
        form.lengthUnit === "in" ? CM_PER_INCH : 1,
        "Height",
      );

      const weight = toStoredMeasurement(
        form.current_weight_kg,
        form.weightUnit === "lb" ? KG_PER_POUND : 1,
        "Current weight",
        true,
      );

      await createProfile({
        profile_name: name,
        dob: form.dob,
        gender: form.gender,
        height_cm: height,
        current_weight_kg: weight,
        activity_level: form.activity_level,
      });

      if (!isCurrent()) return;

      setForm(emptyForm(preferredWeightUnit, preferredLengthUnit));
      setShowForm(false);
    } catch (error) {
      if (isCurrent()) {
        setError(error.message || "Could not create the profile.");
      }
    } finally {
      if (isCurrent()) {
        locked.current = false;
        setBusy("");
      }
    }
  }

  async function remove() {
    if (locked.current || profilesLoading || !selectedProfileId) {
      return;
    }

    if (!window.confirm("Delete the selected profile and its related data?")) {
      return;
    }

    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;

    locked.current = true;
    setBusy("delete");
    setError("");

    try {
      await deleteSelectedProfile();
    } catch (error) {
      if (isCurrent()) {
        setError(error.message || "Could not delete the profile.");
      }
    } finally {
      if (isCurrent()) {
        locked.current = false;
        setBusy("");
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account / profiles"
        title="Profiles"
        subtitle="Each profile belongs to your authenticated account."
        action={
          <NeonButton type="button" disabled={disabled} onClick={toggleForm}>
            <Plus size={16} />
            {showForm ? "Close form" : "New profile"}
          </NeonButton>
        }
      />

      {error && (
        <div className="inline-error page-error" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <GlassCard className="section-gap" glow>
          <form className="form-grid" onSubmit={submit}>
            {(form.weightUnit !== preferredWeightUnit ||
              form.lengthUnit !== preferredLengthUnit) && (
              <p className="form-grid__full" role="status">
                This open form still uses {form.weightUnit} and{" "}
                {form.lengthUnit}. Close and reopen it to use your new
                preferences; unsaved entries will be cleared.
              </p>
            )}

            <label className="field">
              <span>Profile name</span>
              <input
                required
                value={form.profile_name}
                disabled={disabled}
                onChange={(event) => update("profile_name", event.target.value)}
              />
            </label>

            <label className="field">
              <span>DOB</span>
              <input
                required
                type="date"
                min="1000-01-01"
                max={new Date().toISOString().slice(0, 10)}
                value={form.dob}
                disabled={disabled}
                onChange={(event) => update("dob", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Gender</span>
              <select
                required
                value={form.gender}
                disabled={disabled}
                onChange={(event) => update("gender", event.target.value)}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label className="field">
              <span>Height ({form.lengthUnit})</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.height_cm}
                disabled={disabled}
                onChange={(event) => update("height_cm", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Current weight ({form.weightUnit}, optional)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.current_weight_kg}
                disabled={disabled}
                onChange={(event) =>
                  update("current_weight_kg", event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Activity</span>
              <select
                value={form.activity_level}
                disabled={disabled}
                onChange={(event) =>
                  update("activity_level", event.target.value)
                }
              >
                {ACTIVITIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid__full">
              <NeonButton type="submit" disabled={disabled}>
                {busy === "create" ? "Creating..." : "Create"}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      {profilesLoading && <p role="status">Loading profiles…</p>}

      <div className="profile-grid">
        {profiles.map((profile) => {
          const selected =
            Number(selectedProfileId) === Number(profile.profile_id);

          return (
            <button
              type="button"
              key={profile.profile_id}
              disabled={disabled}
              aria-pressed={selected}
              className={`profile-card ${selected ? "is-active" : ""}`}
              onClick={() => {
                if (!locked.current) {
                  selectProfile(profile.profile_id);
                }
              }}
            >
              <div className="profile-card__icon">
                <UserRound size={24} />
              </div>

              <div>
                <strong>{profile.profile_name}</strong>
                <span>
                  {displayWeight(
                    profile.current_weight_kg,
                    preferredWeightUnit,
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <GlassCard className="danger-zone">
        <div>
          <span className="eyebrow-small">Selected profile</span>
          <h3>Delete profile</h3>
        </div>

        <button
          type="button"
          className="danger-button"
          disabled={disabled || !selectedProfileId}
          onClick={remove}
        >
          <Trash2 size={16} />
          {busy === "delete" ? "Deleting..." : "Delete"}
        </button>
      </GlassCard>
    </>
  );
}
