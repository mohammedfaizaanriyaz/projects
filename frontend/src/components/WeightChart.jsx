import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  filterHistory,
  formatFullDate,
  formatShortDate,
  kgToLb,
  round,
} from "../utils/weightUtils";

const CHART_RANGES = ["7D", "1M", "3M", "6M", "1Y", "ALL"];

export default function WeightChart({
  history,
  weightUnit,
  onWeightUnitChange,
  targetWeight,
}) {
  const [range, setRange] = useState("1M");

  const chartData = useMemo(() => {
    return filterHistory(history, range).map((item) => ({
      ...item,
      dateLabel: formatShortDate(item.recorded_date),
      displayWeight:
        weightUnit === "lbs"
          ? round(kgToLb(Number(item.weight_kg)), 1)
          : Number(item.weight_kg),
    }));
  }, [history, range, weightUnit]);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <span className="eyebrow">PROGRESS</span>
          <h2>Weight History</h2>
        </div>

        <div className="chart-controls">
          {CHART_RANGES.map((item) => (
            <button
              key={item}
              className={range === item ? "active" : ""}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="unit-selector">
        <button
          className={weightUnit === "kg" ? "selected" : ""}
          onClick={() => onWeightUnitChange("kg")}
        >
          kg
        </button>
        <button
          className={weightUnit === "lbs" ? "selected" : ""}
          onClick={() => onWeightUnitChange("lbs")}
        >
          lbs
        </button>
      </div>

      <div className="chart">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 12, bottom: 5, left: -8 }}
            >
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26e6a2" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#26e6a2" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1d293c"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                stroke="#718096"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="displayWeight"
                stroke="#718096"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <Tooltip content={<WeightTooltip unit={weightUnit} />} />

              {targetWeight !== null && (
                <ReferenceLine
                  y={weightUnit === "lbs" ? kgToLb(targetWeight) : targetWeight}
                  stroke="#866cff"
                  strokeDasharray="6 6"
                  label={{ value: "Goal", fill: "#a999ff", fontSize: 11 }}
                />
              )}

              <Area
                type="monotone"
                dataKey="displayWeight"
                stroke="#26e6a2"
                strokeWidth={3}
                fill="url(#weightFill)"
                dot={{
                  r: 4,
                  fill: "#26e6a2",
                  stroke: "#09120f",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function WeightTooltip({ active, payload, unit }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const record = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <span>{formatFullDate(record.recorded_date)}</span>
      <strong>
        {round(payload[0].value, 1)} {unit}
      </strong>
      {record.bmi && <small>BMI {Number(record.bmi).toFixed(1)}</small>}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="empty-chart">
      <LineChart />
      <h3>No entries in this period</h3>
      <p>Add weight records or select ALL to view your complete history.</p>
    </div>
  );
}
