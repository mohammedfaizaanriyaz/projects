import { useState } from "react";
import { Activity, ChevronRight, Target, X } from "lucide-react";
import { Field, HeightField, MeasurementField, SelectField } from "./FormFields";
import {
  bmiCategory,
  calculateBMI,
  emptyProfile,
  feetInchesToCm,
  healthyRange,
  lengthToCm,
  weightToKg,
} from "../utils/weightUtils";


export default function ProfileWizard({
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

