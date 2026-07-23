import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateLinearTrend, calculateScoreDomain } from "../chart.utils";
import type { TrendPoint, TrendSeries } from "../dashboard.types";

const TREND_COLORS = [
  "#4847dc",
  "#d45b78",
  "#16877c",
  "#d18425",
  "#7b55c7",
  "#3c78b5",
  "#8a6d3b",
  "#b34d4d",
];

type SecondaryFilter = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function TrendChart({
  title,
  values,
  series,
  secondaryFilter,
}: {
  title: string;
  values: TrendPoint[];
  series: TrendSeries[];
  secondaryFilter?: SecondaryFilter;
}) {
  const [selectedSeries, setSelectedSeries] = useState("all");
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  useEffect(() => {
    if (
      selectedSeries !== "all" &&
      selectedSeries !== "overall" &&
      !series.some((item) => item.key === selectedSeries)
    ) {
      setSelectedSeries("all");
    }
  }, [selectedSeries, series]);

  const visibleSeries =
    selectedSeries === "all"
      ? series
      : series.filter((item) => item.key === selectedSeries);
  const showOverall = selectedSeries === "all" || selectedSeries === "overall";
  const selectedPointCount = values.filter(
    (point) => typeof point[selectedSeries] === "number",
  ).length;
  const trendData =
    selectedSeries === "all" ? values : calculateLinearTrend(values, selectedSeries);
  const showTrend = selectedSeries !== "all" && selectedPointCount >= 2;
  const visibleKeys = [
    ...(showOverall ? ["overall"] : []),
    ...visibleSeries.map((item) => item.key),
    ...(showTrend ? ["__trend"] : []),
  ];
  const visibleScores = trendData.flatMap((point) =>
    visibleKeys
      .map((key) => point[key])
      .filter((value): value is number => typeof value === "number"),
  );
  const yDomain = calculateScoreDomain(visibleScores);

  return (
    <section className="card chart">
      <div className="chart-heading">
        <h2>{title}</h2>
        <div className="chart-filters">
          <label className="chart-category-filter">
            <span>Category</span>
            <select
              value={selectedSeries}
              onChange={(event) => setSelectedSeries(event.target.value)}
            >
              <option value="all">All categories</option>
              <option value="overall">Overall</option>
              {series.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {secondaryFilter && (
            <label className="chart-category-filter">
              <span>{secondaryFilter.label}</span>
              <select
                value={secondaryFilter.value}
                onChange={(event) => secondaryFilter.onChange(event.target.value)}
              >
                {secondaryFilter.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {values.length > 1 ? (
        <div className="trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 42, left: 0 }}>
              <CartesianGrid stroke="#e5e6ef" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                height={62}
                tick={{ fill: "#55586a", fontSize: 11 }}
              />
              <YAxis
                domain={yDomain}
                tickCount={6}
                allowDecimals
                tick={{ fill: "#777b8e", fontSize: 11 }}
                tickFormatter={(value) => Number(value).toFixed(1)}
              />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}/4`} />
              <Legend
                align="right"
                verticalAlign="middle"
                layout="vertical"
                iconType="plainline"
                wrapperStyle={{ fontSize: 11, paddingLeft: 12 }}
                onMouseEnter={(entry) => setHoveredSeries(String(entry.dataKey ?? entry.value))}
                onMouseLeave={() => setHoveredSeries(null)}
                onClick={(entry) => {
                  const key = String(entry.dataKey ?? "");
                  if (key === "overall" || series.some((item) => item.key === key)) {
                    setSelectedSeries(key);
                    setHoveredSeries(null);
                  }
                }}
              />
              {showOverall && (
                <Line
                  type="monotone"
                  name="Overall"
                  dataKey="overall"
                  stroke="#1c2332"
                  strokeWidth={2.5}
                  opacity={hoveredSeries && hoveredSeries !== "overall" ? 0.15 : 1}
                  dot={{ r: 3.5, fill: "#1c2332" }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  style={{ transition: "opacity 180ms ease" }}
                />
              )}
              {visibleSeries.map((item) => {
                const colorIndex = series.findIndex((seriesItem) => seriesItem.key === item.key);
                const color = TREND_COLORS[colorIndex % TREND_COLORS.length];
                return (
                  <Line
                    key={item.key}
                    type="monotone"
                    name={item.name}
                    dataKey={item.key}
                    stroke={color}
                    strokeWidth={2}
                    opacity={hoveredSeries && hoveredSeries !== item.key ? 0.15 : 1}
                    dot={{ r: 3.5, fill: color }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    style={{ transition: "opacity 180ms ease" }}
                  />
                );
              })}
              {showTrend && (
                <Line
                  type="linear"
                  name="Trend"
                  dataKey="__trend"
                  stroke={
                    selectedSeries === "overall"
                      ? "#777b8e"
                      : TREND_COLORS[
                          Math.max(0, series.findIndex((item) => item.key === selectedSeries)) %
                            TREND_COLORS.length
                        ]
                  }
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  opacity={hoveredSeries && hoveredSeries !== "__trend" ? 0.15 : 0.8}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  style={{ transition: "opacity 180ms ease" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="unavailable">At least two dated periods are needed to show a trend.</p>
      )}
    </section>
  );
}
