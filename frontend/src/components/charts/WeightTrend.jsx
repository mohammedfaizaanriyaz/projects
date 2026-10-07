import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlassCard from "../ui/GlassCard";
import { useApp } from "../../context/AppContext";

const KG_PER_POUND = 0.45359237;

function formatDate(value) {
  if (!value) return "";

  const text = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) return text;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  const validDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!validDate) return text;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatWeight(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function WeightTrend({ records = [] }) {
  const { weightUnit, dataStatus } = useApp();
  const unit = weightUnit === "lb" ? "lb" : "kg";
  const gradientId = `weight-fill-${useId().replace(/:/g, "")}`;

  const data = useMemo(() => records.slice(-500).flatMap((record) => {
    const rawWeight = record.weight_kg;

    if (rawWeight === null || rawWeight === undefined || rawWeight === "") {
      return [];
    }

    const kilograms = Number(rawWeight);

    if (!Number.isFinite(kilograms) || kilograms <= 0) {
      return [];
    }

    return [
      {
        date: formatDate(record.recorded_date),
        fullDate: String(record.recorded_date),
        value: unit === "lb" ? kilograms / KG_PER_POUND : kilograms,
      },
    ];
  }), [records, unit]);

  return (
    <GlassCard className="chart-card" glow>
      <div className="card-heading">
        <div>
          <span className="eyebrow-small">Real history</span>
          <h3>Weight trend ({unit})</h3>
        </div>

        <span className="metric-chip">{records.length > 500 ? "Latest 500 of " + records.length : data.length} records</span>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          {dataStatus?.weight === "loading" || dataStatus?.weight === "idle" ? "Loading weight history…" : dataStatus?.weight === "error" ? "Weight history is unavailable. Retry loading your data." : "Add your first weight record to see a trend."}
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 12,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(255,255,255,.06)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fill: "#7f8aa7", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                domain={[
                  (minimum) => Math.max(0, minimum - 1),
                  (maximum) => maximum + 1,
                ]}
                tick={{ fill: "#7f8aa7", fontSize: 11 }}
                tickFormatter={formatWeight}
                tickLine={false}
                axisLine={false}
                width={60}
              />

              <Tooltip
                contentStyle={{
                  background: "#0b1020",
                  border: "1px solid rgba(139,92,246,.35)",
                  borderRadius: 12,
                }}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullDate || label
                }
                formatter={(value) => [
                  `${formatWeight(value)} ${unit}`,
                  "Weight",
                ]}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#9b7cff"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={{
                  r: 3,
                  fill: "#0b1020",
                  stroke: "#9b7cff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
