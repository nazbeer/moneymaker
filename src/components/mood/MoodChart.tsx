"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { MoodData } from "@/lib/types";
import { MOOD_EMOJIS } from "@/lib/constants";

interface ChartDataPoint {
  date: string;
  mood: number;
  label: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const moodInfo = MOOD_EMOJIS[data.mood];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
      <p className="text-sm font-medium text-gray-900">
        {moodInfo?.emoji} {moodInfo?.label}
      </p>
      <p className="text-xs text-gray-500 mt-1">{data.date}</p>
    </div>
  );
}

export default function MoodChart({ data: externalData }: { data?: MoodData[] } = {}) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const res = await fetch("/api/mood");
        if (!res.ok) throw new Error("Failed to fetch moods");
        const moods: MoodData[] = await res.json();

        const chartData: ChartDataPoint[] = moods.map((m) => ({
          date: new Date(m.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          mood: m.mood,
          label: MOOD_EMOJIS[m.mood]?.label || "",
        }));

        setData(chartData);
      } catch (error) {
        console.error("Error fetching mood data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoods();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Mood Over Time
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          No mood entries yet. Start logging to see your trends!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Mood Over Time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="url(#moodGradient)"
            strokeWidth={3}
            dot={{
              r: 5,
              fill: "#7c3aed",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 7,
              fill: "#7c3aed",
              stroke: "#fff",
              strokeWidth: 3,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
