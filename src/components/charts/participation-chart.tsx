"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ParticipationChart({ data }: { data: { month: string; rate: number; attended: number; activities: number }[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(v, _n, p) => [`${v}% (${p.payload.attended} lượt, ${p.payload.activities} hoạt động)`, "Tỷ lệ tham gia"]}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }} />
          <Bar dataKey="rate" fill="#0b63b8" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
