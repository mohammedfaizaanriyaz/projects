import { Plus, Scale, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import WeightTrend from "../components/charts/WeightTrend";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyForm(weightUnit, lengthUnit) {
  return {
    weight_kg: "",
    recorded_date: localToday(),
    waist_cm: "",
    neck_cm: "",
    hip_cm: "",
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

  // The backend stores these measurements with two decimal places.
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
    return "—";
  }

  const kilograms = Number(value);
  if (!Number.isFinite(kilograms)) return "—";

  const displayed = unit === "lb" ? kilograms / KG_PER_POUND : kilograms;

  return `${displayed.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

export default function WeightPage() {
  const {
    user,
    selectedProfileId,
    selectedProfile,
    weightHistory,
    addWeight,
    deleteWeight,
    dataStatus,
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
        <p role="status">Select a profile and wait for its details to load.</p>
      </GlassCard>
    );
  }

  return (
    <WeightWorkspace
      key={JSON.stringify([user?.user_id, selectedProfileId])}
      profile={selectedProfile}
      records={weightHistory || []}
      addWeight={addWeight}
      deleteWeight={deleteWeight}
      historyStatus={dataStatus.weight}
      weightUnit={weightUnit === "lb" ? "lb" : "kg"}
      lengthUnit={lengthUnit === "in" ? "in" : "cm"}
    />
  );
}

function WeightWorkspace({
  profile,
  records,
  addWeight,
  deleteWeight,
  historyStatus,
  weightUnit,
  lengthUnit,
}) {
  const [visibleRecords, setVisibleRecords] = useState(100);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm(weightUnit, lengthUnit));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const locked = useRef(false);
  const lifecycle = useRef(0);

  useLayoutEffect(() => {
    lifecycle.current += 1;

    return () => {
      lifecycle.current += 1;
      locked.current = false;
    };
  }, []);

  const isFemale = profile.gender?.trim().toLowerCase() === "female";

  const measurementFields = [
    ["waist_cm", "Waist"],
    ["neck_cm", "Neck"],
    ...(isFemale ? [["hip_cm", "Hip"]] : []),
  ];

  function update(field, value) {
    if (locked.current) return;

    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function toggleForm() {
    if (locked.current) return;

    setError("");
    setSuccess("");

    if (!showForm) {
      setForm(emptyForm(weightUnit, lengthUnit));
    }

    setShowForm((current) => !current);
  }

  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;

    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;

    locked.current = true;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const weightFactor = form.weightUnit === "lb" ? KG_PER_POUND : 1;

      const lengthFactor = form.lengthUnit === "in" ? CM_PER_INCH : 1;

      const payload = {
        weight_kg: toStoredMeasurement(form.weight_kg, weightFactor, "Weight"),
        recorded_date: form.recorded_date,
        waist_cm: toStoredMeasurement(
          form.waist_cm,
          lengthFactor,
          "Waist",
          true,
        ),
        neck_cm: toStoredMeasurement(form.neck_cm, lengthFactor, "Neck", true),
        hip_cm: isFemale
          ? toStoredMeasurement(form.hip_cm, lengthFactor, "Hip", true)
          : null,
      };

      await addWeight(payload);

      if (!isCurrent()) return;

      setForm(emptyForm(weightUnit, lengthUnit));
      setShowForm(false);
      setSuccess(
        "Weight saved. Your current body measurements were not changed.",
      );
    } catch (error) {
      if (isCurrent()) {
        setError(error.message || "Could not save your weight.");
      }
    } finally {
      if (isCurrent()) {
        locked.current = false;
        setSaving(false);
      }
    }
  }

  async function removeRecord(record) {
    if (locked.current || !window.confirm(`Delete the weight record for ${record.recorded_date}? You can add a corrected entry afterwards.`)) return;
    const generation = lifecycle.current;
    locked.current = true; setSaving(true); setError(""); setSuccess("");
    try {
      await deleteWeight(record.weight_id);
      if (lifecycle.current === generation) setSuccess("Weight record deleted.");
    } catch (error) {
      if (lifecycle.current === generation) setError(error.message);
    } finally {
      if (lifecycle.current === generation) { locked.current = false; setSaving(false); }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Health / trend"
        title="Weight tracker"
        subtitle={`Weight history for ${profile.profile_name}. Update current measurements on the Measurements page.`}
        action={
          <NeonButton type="button" disabled={saving} onClick={toggleForm}>
            <Plus size={16} />
            {showForm ? "Close form" : "Add record"}
          </NeonButton>
        }
      />

      {success && (
        <div className="inline-success section-gap" role="status">
          {success}
        </div>
      )}

      {error && !showForm && <div className="inline-error" role="alert">{error}</div>}
      {showForm && (
        <GlassCard className="section-gap" glow>
          <form className="form-grid" onSubmit={submit}>
            <label className="field">
              <span>Weight ({form.weightUnit})</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.weight_kg}
                disabled={saving}
                onChange={(event) => update("weight_kg", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Date measured</span>
              <input
                required
                type="date"
                min={profile.dob || "1000-01-01"}
                max={localToday()}
                value={form.recorded_date}
                disabled={saving}
                onChange={(event) =>
                  update("recorded_date", event.target.value)
                }
              />
            </label>

            {(form.weightUnit !== weightUnit ||
              form.lengthUnit !== lengthUnit) && (
              <p className="form-grid__full" role="status">
                This open form still uses {form.weightUnit} and{" "}
                {form.lengthUnit}. Close and reopen it to use your new
                preferences; any unsaved entries will be cleared.
              </p>
            )}

            <div className="form-grid__full">
              <strong>Optional body-fat estimate</strong>
              <p>
                Enter measurements taken on the recorded date.
                {isFemale
                  ? " Waist, neck and hip are needed."
                  : " Waist and neck are needed."}{" "}
                Missing or invalid measurements produce —.
              </p>
              <p>
                These measurements are used only for this calculation. Their
                individual values are not saved in weight history, and they do
                not update your current measurements.
              </p>
              <p>
                BMI and body-fat estimates use your profile’s current height.
              </p>
            </div>

            {measurementFields.map(([field, label]) => (
              <label className="field" key={field}>
                <span>
                  {label} ({form.lengthUnit})
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form[field]}
                  disabled={saving}
                  onChange={(event) => update(field, event.target.value)}
                  placeholder="Optional"
                />
              </label>
            ))}

            {error && (
              <div className="inline-error form-grid__full" role="alert">
                {error}
              </div>
            )}

            <div className="form-grid__full">
              <NeonButton type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save weight"}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="stack-grid">
        <WeightTrend records={records} />

        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">History</span>
              <h3>Weight records</h3>
            </div>
            <Scale size={18} />
          </div>

          {records.length === 0 ? (
            <div className="empty-state" role="status">{historyStatus === "ready" ? "No records yet." : historyStatus === "error" ? "Weight history could not be loaded. Use Retry loading above." : "Loading weight history…"}</div>
          ) : (
            <div className="table-scroll">
              <table className="history-table">
                <caption className="sr-only">Weight records for {profile.profile_name}</caption>
                <thead><tr><th scope="col">Date</th><th scope="col">Weight ({weightUnit})</th><th scope="col">BMI</th><th scope="col">Body fat</th><th scope="col">Actions</th></tr></thead>
                <tbody>{[...records].reverse().slice(0, visibleRecords).map((record) => <tr key={record.weight_id}>
                  <td>{String(record.recorded_date).slice(0, 10)}</td>
                  <td>{displayWeight(record.weight_kg, weightUnit)}</td>
                  <td>{record.bmi ?? "—"}</td>
                  <td>{record.body_fat_percentage != null ? `${record.body_fat_percentage}%` : "—"}</td>
                  <td><button className="icon-button" disabled={saving} aria-label={`Delete weight on ${record.recorded_date}`} onClick={() => removeRecord(record)}><Trash2 size={15} /></button></td>
                </tr>)}</tbody>
              </table>
              {records.length > visibleRecords && <button className="text-button" onClick={() => setVisibleRecords((count) => count + 100)}>Show 100 more records</button>}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
