import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import Modal from "./Modal";
import { Field, MeasurementField, SelectField } from "./FormFields";

export default function WeightModal({
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

