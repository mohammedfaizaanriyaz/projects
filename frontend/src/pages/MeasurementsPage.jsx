import { Save } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;

const MEASUREMENTS = [
  ["height_cm", "Height", true],
  ["waist_cm", "Waist", false],
  ["chest_cm", "Chest", false],
  ["neck_cm", "Neck", false],
  ["hip_cm", "Hip", false],
  ["target_weight_kg", "Target weight", false],
];

const ACTIVITIES = [
  ["not_specified", "Not specified"],
  ["sedentary", "Sedentary"],
  ["lightly_active", "Lightly active"],
  ["moderately_active", "Moderately active"],
  ["very_active", "Very active"],
  ["extra_active", "Extra active"],
];

function measurementFactor(field, units) {
  if (field === "target_weight_kg") {
    return units.weight === "lb" ? KG_PER_POUND : 1;
  }

  return units.length === "in" ? CM_PER_INCH : 1;
}

function displayMeasurement(value, factor) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "";

  return String(Number((number / factor).toFixed(2)));
}

function createEditor(profile, units) {
  const values = {
    profile_name: profile.profile_name || "",
    dob: profile.dob ? String(profile.dob).slice(0, 10) : "",
    gender: profile.gender || "",
    activity_level: profile.activity_level || "not_specified",
  };

  const stored = {};

  for (const [field] of MEASUREMENTS) {
    stored[field] = profile[field] == null ? null : Number(profile[field]);

    values[field] = displayMeasurement(
      stored[field],
      measurementFactor(field, units),
    );
  }

  return {
    values,
    originalValues: { ...values },
    stored,
  };
}

function storedMeasurement(editor, field, label, required, units) {
  const value = editor.values[field];

  // Preserve the original metric value if the input is unchanged.
  if (value === editor.originalValues[field]) {
    if (required && editor.stored[field] == null) {
      throw new Error(`${label} is required.`);
    }

    return editor.stored[field];
  }

  if (value.trim() === "") {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }

  const entered = Number(value);

  if (!Number.isFinite(entered) || entered <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  const converted = entered * measurementFactor(field, units);
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

export default function MeasurementsPage() {
  const {
    user,
    selectedProfileId,
    selectedProfile,
    updateSelectedProfile,
    weightUnit,
    lengthUnit,
  } = useApp();

  const profileReady =
    selectedProfileId != null &&
    selectedProfile &&
    Number(selectedProfile.profile_id) === Number(selectedProfileId);

  if (!profileReady) {
    return (
      <GlassCard>
        <p role="status">Waiting for the selected profile’s details…</p>
      </GlassCard>
    );
  }

  return (
    <MeasurementsEditor
      key={JSON.stringify([user?.user_id, selectedProfileId])}
      profile={selectedProfile}
      updateSelectedProfile={updateSelectedProfile}
      preferredWeightUnit={weightUnit === "lb" ? "lb" : "kg"}
      preferredLengthUnit={lengthUnit === "in" ? "in" : "cm"}
    />
  );
}

function MeasurementsEditor({
  profile,
  updateSelectedProfile,
  preferredWeightUnit,
  preferredLengthUnit,
}) {
  // Keep the units fixed while this form is open.
  const [units] = useState(() => ({
    weight: preferredWeightUnit,
    length: preferredLengthUnit,
  }));

  const [editor, setEditor] = useState(() => createEditor(profile, units));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const locked = useRef(false);
  const lifecycle = useRef(0);
  const formProfileId = Number(profile.profile_id);
  const form = editor.values;

  useLayoutEffect(() => {
    lifecycle.current += 1;

    return () => {
      lifecycle.current += 1;
      locked.current = false;
    };
  }, []);

  function update(field, value) {
    if (locked.current) return;

    setEditor((current) => ({
      ...current,
      values: { ...current.values, [field]: value },
    }));

    setMessage("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;

    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;

    locked.current = true;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const profileName = form.profile_name.trim();

      if (!profileName || Array.from(profileName).length > 100) {
        throw new Error("Profile name must contain 1 to 100 characters.");
      }

      const payload = {
        profile_name: profileName,
        dob: form.dob,
        gender: form.gender,
        activity_level: form.activity_level,
      };

      for (const [field, label, required] of MEASUREMENTS) {
        payload[field] = storedMeasurement(
          editor,
          field,
          label,
          required,
          units,
        );
      }

      await updateSelectedProfile(payload, formProfileId);

      if (!isCurrent()) return;

      // The saved metric values become the new unchanged-value baseline.
      setEditor(createEditor(payload, units));
      setMessage("Profile updated.");
    } catch (error) {
      if (isCurrent()) {
        setError(error.message || "Could not update the profile.");
      }
    } finally {
      if (isCurrent()) {
        locked.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Health / profile"
        title="Measurements"
        subtitle="Edit your current measurements using the units shown beside each field."
      />

      <GlassCard glow>
        <form className="form-grid" onSubmit={submit}>
          {(units.weight !== preferredWeightUnit ||
            units.length !== preferredLengthUnit) && (
            <p className="form-grid__full" role="status">
              This open form still uses {units.weight} and {units.length}. Save
              your changes, then reopen this page to use your new unit
              preferences.
            </p>
          )}

          <label className="field">
            <span>Profile name</span>
            <input
              required
              value={form.profile_name}
              disabled={saving}
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
              disabled={saving}
              onChange={(event) => update("dob", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Gender</span>
            <select
              required
              value={form.gender}
              disabled={saving}
              onChange={(event) => update("gender", event.target.value)}
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          {MEASUREMENTS.map(([field, label, required]) => {
            const unit =
              field === "target_weight_kg" ? units.weight : units.length;

            return (
              <label className="field" key={field}>
                <span>
                  {label} ({unit})
                </span>
                <input
                  required={required}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form[field]}
                  disabled={saving}
                  onChange={(event) => update(field, event.target.value)}
                  placeholder={required ? undefined : "Optional"}
                />
              </label>
            );
          })}

          <label className="field">
            <span>Activity</span>
            <select
              value={form.activity_level}
              disabled={saving}
              onChange={(event) => update("activity_level", event.target.value)}
            >
              {ACTIVITIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="inline-error form-grid__full" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="inline-success form-grid__full" role="status">
              {message}
            </div>
          )}

          <div className="form-grid__full">
            <NeonButton type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save changes"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </>
  );
}
