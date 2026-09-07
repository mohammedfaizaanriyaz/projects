import {
  Plus,
  Scale
} from "lucide-react";

import {
  useState
} from "react";

import WeightTrend
  from "../components/charts/WeightTrend";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import {
  useApp
} from "../context/AppContext";

export default function WeightPage() {
  const {
    selectedProfile,
    weightHistory,
    addWeight
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
    useState({
      weight_kg: "",
      recorded_date: "",
      waist_cm: "",
      chest_cm: "",
      neck_cm: "",
      hip_cm: ""
    });

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

  function optionalNumber(
    value
  ) {
    return value === ""
      ? undefined
      : Number(value);
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    try {
      setError("");

      await addWeight({
        weight_kg:
          Number(
            form.weight_kg
          ),
        recorded_date:
          form.recorded_date ||
          undefined,
        waist_cm:
          optionalNumber(
            form.waist_cm
          ),
        chest_cm:
          optionalNumber(
            form.chest_cm
          ),
        neck_cm:
          optionalNumber(
            form.neck_cm
          ),
        hip_cm:
          optionalNumber(
            form.hip_cm
          )
      });

      setForm({
        weight_kg: "",
        recorded_date: "",
        waist_cm: "",
        chest_cm: "",
        neck_cm: "",
        hip_cm: ""
      });

      setShowForm(false);
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Health / trend"
        title="Weight tracker"
        subtitle={`Real records for ${selectedProfile?.profile_name || "your selected profile"}.`}
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
            Add record
          </NeonButton>
        }
      />

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
                Weight (kg)
              </span>
              <input
                required
                type="number"
                min="1"
                step="0.1"
                value={
                  form.weight_kg
                }
                onChange={(
                  event
                ) =>
                  update(
                    "weight_kg",
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label className="field">
              <span>
                Date
              </span>
              <input
                type="date"
                value={
                  form
                    .recorded_date
                }
                onChange={(
                  event
                ) =>
                  update(
                    "recorded_date",
                    event.target
                      .value
                  )
                }
              />
            </label>

            {[
              [
                "waist_cm",
                "Waist (cm)"
              ],
              [
                "chest_cm",
                "Chest (cm)"
              ],
              [
                "neck_cm",
                "Neck (cm)"
              ],
              [
                "hip_cm",
                "Hip (cm)"
              ]
            ].map(
              ([
                field,
                label
              ]) => (
                <label
                  className="field"
                  key={
                    field
                  }
                >
                  <span>
                    {label}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={
                      form[field]
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        field,
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional"
                  />
                </label>
              )
            )}

            {error && (
              <div className="inline-error form-grid__full">
                {error}
              </div>
            )}

            <div className="form-grid__full">
              <NeonButton
                type="submit"
              >
                Save weight
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="stack-grid">
        <WeightTrend
          records={
            weightHistory
          }
        />

        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Database
              </span>
              <h3>
                Weight history
              </h3>
            </div>

            <Scale
              size={18}
            />
          </div>

          {weightHistory.length ===
          0 ? (
            <div className="empty-state">
              No records yet.
            </div>
          ) : (
            <div className="data-table">
              <div className="data-table__head data-table__head--four">
                <span>Date</span>
                <span>
                  Weight
                </span>
                <span>BMI</span>
                <span>
                  Body fat
                </span>
              </div>

              {[...weightHistory]
                .reverse()
                .map(
                  (record) => (
                    <div
                      className="data-table__row data-table__row--four"
                      key={
                        record.weight_id
                      }
                    >
                      <span>
                        {String(
                          record.recorded_date
                        ).slice(
                          0,
                          10
                        )}
                      </span>
                      <strong>
                        {
                          record.weight_kg
                        }{" "}
                        kg
                      </strong>
                      <span>
                        {record.bmi ??
                          "—"}
                      </span>
                      <span>
                        {record
                          .body_fat_percentage !=
                        null
                          ? `${record.body_fat_percentage}%`
                          : "—"}
                      </span>
                    </div>
                  )
                )}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
