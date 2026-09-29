import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";

import { useApp } from "../context/AppContext";

export default function MeasurementsPage() {
  const {
    selectedProfileId,
    selectedProfile,
    updateSelectedProfile
  } = useApp();

  const [formProfileId, setFormProfileId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    profile_name: "",
    dob: "",
    gender: "",
    height_cm: "",
    waist_cm: "",
    chest_cm: "",
    neck_cm: "",
    hip_cm: "",
    target_weight_kg: "",
    activity_level: "not_specified"
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const profileMatches =
      selectedProfile != null &&
      Number(selectedProfile.profile_id) ===
      Number(selectedProfileId);

    if (!profileMatches) {
      setFormProfileId(null);
      return;
    }

    setFormProfileId(Number(selectedProfile.profile_id));

    setForm({
      profile_name: selectedProfile.profile_name || "",

      dob: selectedProfile.dob
        ? String(selectedProfile.dob).slice(0, 10)
        : "",

      gender: selectedProfile.gender || "",
      height_cm: selectedProfile.height_cm ?? "",
      waist_cm: selectedProfile.waist_cm ?? "",
      chest_cm: selectedProfile.chest_cm ?? "",
      neck_cm: selectedProfile.neck_cm ?? "",
      hip_cm: selectedProfile.hip_cm ?? "",

      target_weight_kg:
        selectedProfile.target_weight_kg ?? "",

      activity_level:
        selectedProfile.activity_level || "not_specified"
    });

    setMessage("");
    setError("");
  }, [selectedProfile, selectedProfileId]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function optionalNumber(value) {
    return value === "" ? null : Number(value);
  }

  const formReady =
    formProfileId !== null &&
    selectedProfile != null &&
    Number(formProfileId) === Number(selectedProfileId) &&
    Number(selectedProfile.profile_id) ===
    Number(selectedProfileId);

  async function submit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!formReady) {
      setError(
        "Wait for the selected profile's details to load."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateSelectedProfile(
        {
          profile_name: form.profile_name,
          dob: form.dob,
          gender: form.gender,
          height_cm: Number(form.height_cm),

          waist_cm: optionalNumber(form.waist_cm),
          chest_cm: optionalNumber(form.chest_cm),
          neck_cm: optionalNumber(form.neck_cm),
          hip_cm: optionalNumber(form.hip_cm),

          target_weight_kg:
            optionalNumber(form.target_weight_kg),

          activity_level: form.activity_level
        },
        formProfileId
      );

      setMessage("Profile updated.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!formReady) {
    return (
      <GlassCard>
        <p role="status">
          Waiting for the selected profile's details…
        </p>
      </GlassCard>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Health / profile"
        title="Measurements"
        subtitle="Edit the optional measurements and profile fields stored in MariaDB."
      />

      <GlassCard glow>
        <form className="form-grid" onSubmit={submit}>
          <label className="field">
            <span>Profile name</span>

            <input
              required
              value={form.profile_name}
              onChange={(event) =>
                update("profile_name", event.target.value)
              }
            />
          </label>

          <label className="field">
            <span>DOB</span>

            <input
              required
              type="date"
              value={form.dob}
              onChange={(event) =>
                update("dob", event.target.value)
              }
            />
          </label>

          <label className="field">
            <span>Gender</span>

            <select
              value={form.gender}
              onChange={(event) =>
                update("gender", event.target.value)
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label className="field">
            <span>Height (cm)</span>

            <input
              required
              type="number"
              step="0.1"
              min="1"
              value={form.height_cm}
              onChange={(event) =>
                update("height_cm", event.target.value)
              }
            />
          </label>

          {[
            ["waist_cm", "Waist (cm)"],
            ["chest_cm", "Chest (cm)"],
            ["neck_cm", "Neck (cm)"],
            ["hip_cm", "Hip (cm)"],
            ["target_weight_kg", "Target weight (kg)"]
          ].map(([field, label]) => (
            <label className="field" key={field}>
              <span>{label}</span>

              <input
                type="number"
                min="1"
                step="0.1"
                value={form[field]}
                onChange={(event) =>
                  update(field, event.target.value)
                }
                placeholder="Optional"
              />
            </label>
          ))}

          <label className="field">
            <span>Activity</span>

            <select
              value={form.activity_level}
              onChange={(event) =>
                update("activity_level", event.target.value)
              }
            >
              <option value="not_specified">
                Not specified
              </option>
              <option value="sedentary">
                Sedentary
              </option>
              <option value="lightly_active">
                Lightly active
              </option>
              <option value="moderately_active">
                Moderately active
              </option>
              <option value="very_active">
                Very active
              </option>
              <option value="extra_active">
                Extra active
              </option>
            </select>
          </label>

          {error && (
            <div
              className="inline-error form-grid__full"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="inline-success form-grid__full"
              role="status"
            >
              {message}
            </div>
          )}

          <div className="form-grid__full">
            <NeonButton
              type="submit"
              disabled={!formReady || saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save changes"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </>
  );
}