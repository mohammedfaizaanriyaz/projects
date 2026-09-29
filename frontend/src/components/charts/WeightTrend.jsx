import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import GlassCard
  from "../ui/GlassCard";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const text = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) {
    return text;
  }

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

  if (!validDate) {
    return text;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

export default function WeightTrend({
  records = []
}) {
  const data =
    records.map(
      (record) => ({
        date:
          formatDate(
            record.recorded_date
          ),
        value:
          Number(
            record.weight_kg
          )
      })
    );

  return (
    <GlassCard
      className="chart-card"
      glow
    >
      <div className="card-heading">
        <div>
          <span className="eyebrow-small">
            Real history
          </span>
          <h3>
            Weight trend
          </h3>
        </div>

        <span className="metric-chip">
          {data.length} records
        </span>
      </div>

      {data.length ===
      0 ? (
        <div className="empty-state">
          Add your first weight
          record to see a trend.
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 12,
                left: -20,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient
                  id="weightFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#8b5cf6"
                    stopOpacity={
                      0.55
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="#22d3ee"
                    stopOpacity={
                      0.03
                    }
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(255,255,255,.06)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fill:
                    "#7f8aa7",
                  fontSize:
                    11
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                domain={[
                  "dataMin - 1",
                  "dataMax + 1"
                ]}
                tick={{
                  fill:
                    "#7f8aa7",
                  fontSize:
                    11
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={{
                  background:
                    "#0b1020",
                  border:
                    "1px solid rgba(139,92,246,.35)",
                  borderRadius:
                    12
                }}
                formatter={(
                  value
                ) => [
                  `${value} kg`,
                  "Weight"
                ]}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#9b7cff"
                strokeWidth={3}
                fill="url(#weightFill)"
                dot={{
                  r: 3,
                  fill:
                    "#0b1020",
                  stroke:
                    "#9b7cff",
                  strokeWidth:
                    2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
