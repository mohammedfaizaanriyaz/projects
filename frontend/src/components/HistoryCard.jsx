import { CalendarDays, Scale } from "lucide-react";
import { displayWeight, formatFullDate } from "../utils/weightUtils";

export default function HistoryCard({ history, weightUnit, onLog }) {
  const recent = [...history].reverse().slice(0, 6);

  return (
    <article className="card history-card">
      <div className="card-header">
        <div>
          <span className="eyebrow">RECENT</span>

          <h2>Weight Entries</h2>
        </div>

        <CalendarDays />
      </div>

      {recent.length === 0 ? (
        <div className="empty-history">
          <Scale />

          <p>No weight records yet.</p>

          <button className="secondary-button" onClick={onLog}>
            Log first weight
          </button>
        </div>
      ) : (
        <div className="history-list">
          {recent.map((entry) => (
            <div className="history-row" key={entry.weight_id}>
              <div>
                <strong>
                  {displayWeight(Number(entry.weight_kg), weightUnit)}
                </strong>

                <span>{formatFullDate(entry.recorded_date)}</span>
              </div>

              <div className="history-health">
                <span>BMI</span>

                <strong>
                  {entry.bmi ? Number(entry.bmi).toFixed(1) : "—"}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

// ============================================================
// PROFILE WIZARD
// ============================================================
