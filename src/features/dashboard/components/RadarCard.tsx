import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { calculateScoreDomain } from "../chart.utils";
import type { RadarPeriod } from "../dashboard.types";

export function RadarCard({ periods }: { periods: RadarPeriod[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const requestedIndex = periods.findIndex((item) => item.name === selectedPeriod);
  const selectedIndex = Math.max(1, requestedIndex >= 1 ? requestedIndex : periods.length - 1);
  const currentPeriod = periods[selectedIndex];
  const previousPeriod = periods[selectedIndex - 1];
  const values =
    currentPeriod?.values
      .map((item) => ({
        category: item.category,
        current: item.score,
        previous: previousPeriod.values.find(
          (previousItem) => previousItem.category === item.category,
        )?.score,
      }))
      .filter((item) => item.current != null || item.previous != null) ?? [];
  const visibleScores = values.flatMap((item) =>
    [item.current, item.previous].filter(
      (score): score is number => typeof score === "number",
    ),
  );
  const radarDomain = calculateScoreDomain(visibleScores);

  const changePeriod = (nextIndex: number) => {
    const nextPeriod = periods[nextIndex];
    if (nextPeriod) setSelectedPeriod(nextPeriod.name);
  };

  return (
    <section className="card radar-card">
      <h2>Categories radar</h2>
      {periods.length >= 2 && values.length >= 3 ? (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={values} outerRadius="68%">
              <PolarGrid stroke="#cfd2e2" />
              <PolarAngleAxis dataKey="category" tick={{ fill: "#4e5064", fontSize: 12 }} />
              <PolarRadiusAxis
                angle={90}
                domain={radarDomain}
                tickCount={5}
                tick={{ fill: "#777b8e", fontSize: 11 }}
                tickFormatter={(value) => Number(value).toFixed(1)}
              />
              <Tooltip
                formatter={(value, name) => [`${Number(value).toFixed(1)}/4`, String(name)]}
              />
              <Legend
                content={() => (
                  <div className="radar-custom-legend">
                    <span className="radar-period-previous">
                      <i />
                      {previousPeriod.name}
                    </span>
                    <span className="radar-period-current">
                      <i />
                      {currentPeriod.name}
                    </span>
                  </div>
                )}
              />
              <Radar
                name={previousPeriod.name}
                dataKey="previous"
                stroke="#e0782f"
                fill="#e0782f"
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Radar
                name={currentPeriod.name}
                dataKey="current"
                stroke="#4847dc"
                fill="#4847dc"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="radar-period-navigation">
            <button
              type="button"
              aria-label="Previous period comparison"
              disabled={selectedIndex <= 1}
              onClick={() => changePeriod(selectedIndex - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              <b className="radar-period-previous">{previousPeriod.name}</b>
              {" vs "}
              <b className="radar-period-current">{currentPeriod.name}</b>
            </span>
            <button
              type="button"
              aria-label="Next period comparison"
              disabled={selectedIndex >= periods.length - 1}
              onClick={() => changePeriod(selectedIndex + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        <p className="unavailable">
          At least two dated periods and three categories are needed to compare them.
        </p>
      )}
    </section>
  );
}
