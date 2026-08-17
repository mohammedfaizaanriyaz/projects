import { useState } from "react";
import Modal from "./Modal";
import { Field, SelectField } from "./FormFields";

export default function EditProfileModal({
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

