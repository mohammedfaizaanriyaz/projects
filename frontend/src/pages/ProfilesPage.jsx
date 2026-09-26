import {
  Plus,
  Trash2,
  UserRound
} from "lucide-react";

import {
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import {
  useApp
} from "../context/AppContext";

const EMPTY_FORM = {
  profile_name: "",
  dob: "",
  gender: "",
  height_cm: "",
  current_weight_kg:
    "",
  activity_level:
    "not_specified"
};

export default function ProfilesPage() {
  const {
    profiles,
    selectedProfileId,
    selectProfile,
    createProfile,
    deleteSelectedProfile
  } =
    useApp();

  const [
    showForm,
    setShowForm
  ] =
    useState(false);

  const [
    form,
    setForm
  ] =
    useState(
      EMPTY_FORM
    );

  const [
    error,
    setError
  ] =
    useState("");

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

      setForm(
        EMPTY_FORM
      );

      setShowForm(false);
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Delete the selected profile and its related data?"
      )
    ) {
      return;
    }

    try {
      setError("");

      await deleteSelectedProfile();
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account / profiles"
        title="Profiles"
        subtitle="Each profile belongs to your authenticated account."
        action={
          <NeonButton
            onClick={() =>
              setShowForm(
                (current) =>
                  !current
              )
            }
          >
            <Plus size={16} />
            New profile
          </NeonButton>
        }
      />

      {error && (
        <div className="inline-error page-error">
          {error}
        </div>
      )}

      {showForm && (
        <GlassCard
          className="section-gap"
          glow
        >
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
                DOB
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
                (optional)
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
                Activity
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

            <div className="form-grid__full">
              <NeonButton
                type="submit"
              >
                Create
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="profile-grid">
        {profiles.map(
          (profile) => (
            <button
              key={
                profile.profile_id
              }
              className={`profile-card ${
                Number(
                  selectedProfileId
                ) ===
                Number(
                  profile.profile_id
                )
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                selectProfile(
                  profile.profile_id
                )
              }
            >
              <div className="profile-card__icon">
                <UserRound
                  size={24}
                />
              </div>

              <div>
                <strong>
                  {
                    profile.profile_name
                  }
                </strong>
                <span>
                  {profile.current_weight_kg
                    ? `${profile.current_weight_kg} kg`
                    : "No current weight"}
                </span>
              </div>
            </button>
          )
        )}
      </div>

      <GlassCard className="danger-zone">
        <div>
          <span className="eyebrow-small">
            Selected profile
          </span>
          <h3>
            Delete profile
          </h3>
        </div>

        <button
          className="danger-button"
          onClick={
            remove
          }
        >
          <Trash2
            size={16}
          />
          Delete
        </button>
      </GlassCard>
    </>
  );
}
