/**
 * HourlyChart — Bar chart of tokens issued per hour
 *
 * Uses Recharts for responsive SVG-based charts.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HourlyChartProps {
  data: { hour: string; tokens: number }[];
}

export default function HourlyChart({ data }: HourlyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        No data yet — tokens will appear as they are issued
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.tokens), 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="hour"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f1f5f9",
          }}
          cursor={{ fill: "rgba(15, 110, 86, 0.06)" }}
        />
        <Bar dataKey="tokens" radius={[6, 6, 0, 0]} maxBarSize={32}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.tokens >= maxVal * 0.8 ? "#0F6E56" : "#10B981"}
              opacity={entry.tokens > 0 ? 1 : 0.3}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
