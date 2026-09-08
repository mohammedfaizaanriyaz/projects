import {
  Sparkles
} from "lucide-react";

import {
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import {
  useApp
} from "../context/AppContext";

export default function ProfileSetupPage() {
  const {
    user,
    createProfile,
    logout
  } =
    useApp();

  const [
    form,
    setForm
  ] =
    useState({
      profile_name:
        "My Profile",
      dob: "",
      gender: "",
      height_cm: "",
      current_weight_kg:
        "",
      activity_level:
        "not_specified"
    });

  const [
    error,
    setError
  ] =
    useState("");

  const [
    busy,
    setBusy
  ] =
    useState(false);

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value
      })
    );
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    try {
      setBusy(true);
      setError("");

      await createProfile({
        ...form,
        height_cm:
          Number(
            form.height_cm
          ),
        current_weight_kg:
          form
            .current_weight_kg
            ? Number(
                form
                  .current_weight_kg
              )
            : null
      });
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="setup-screen">
      <GlassCard
        className="setup-card"
        glow
      >
        <div className="brand brand--large">
          <div className="brand__mark">
            <Sparkles
              size={20}
            />
          </div>

          <div>
            <strong>VYRA</strong>
            <span>
              FIRST PROFILE
            </span>
          </div>
        </div>

        <span className="page-eyebrow">
          Logged in as{" "}
          {user?.name}
        </span>

        <h1>
          Create your first
          profile
        </h1>

        <p>
          These are the minimum
          fields your existing
          backend requires. Other
          measurements remain
          optional.
        </p>

        <form
          className="form-grid"
          onSubmit={
            submit
          }
        >
          <label className="field">
            <span>
              Profile name
            </span>
            <input
              required
              value={
                form.profile_name
              }
              onChange={(
                event
              ) =>
                update(
                  "profile_name",
                  event.target
                    .value
                )
              }
            />
          </label>

          <label className="field">
            <span>
              Date of birth
            </span>
            <input
              required
              type="date"
              value={
                form.dob
              }
              onChange={(
                event
              ) =>
                update(
                  "dob",
                  event.target
                    .value
                )
              }
            />
          </label>

          <label className="field">
            <span>
              Gender
            </span>
            <select
              required
              value={
                form.gender
              }
              onChange={(
                event
              ) =>
                update(
                  "gender",
                  event.target
                    .value
                )
              }
            >
              <option value="">
                Select
              </option>
              <option value="male">
                Male
              </option>
              <option value="female">
                Female
              </option>
            </select>
          </label>

          <label className="field">
            <span>
              Height (cm)
            </span>
            <input
              required
              type="number"
              min="1"
              step="0.1"
              value={
                form.height_cm
              }
              onChange={(
                event
              ) =>
                update(
                  "height_cm",
                  event.target
                    .value
                )
              }
            />
          </label>

          <label className="field">
            <span>
              Current weight
              (kg, optional)
            </span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={
                form
                  .current_weight_kg
              }
              onChange={(
                event
              ) =>
                update(
                  "current_weight_kg",
                  event.target
                    .value
                )
              }
            />
          </label>

          <label className="field">
            <span>
              Activity level
            </span>
            <select
              value={
                form
                  .activity_level
              }
              onChange={(
                event
              ) =>
                update(
                  "activity_level",
                  event.target
                    .value
                )
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
            <div className="inline-error form-grid__full">
              {error}
            </div>
          )}

          <div className="form-grid__full form-actions">
            <NeonButton
              type="submit"
              disabled={
                busy
              }
            >
              {busy
                ? "Creating..."
                : "Create profile"}
            </NeonButton>

            <button
              type="button"
              className="text-button"
              onClick={
                logout
              }
            >
              Logout
            </button>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
