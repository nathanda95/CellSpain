import { useEffect, useState } from "react";
import type { Answer } from "../../files/file.types";
import { buildTrendData } from "../dashboard.selectors";
import { TrendChart } from "./TrendChart";

export function SeniorityTrendCard({ answers }: { answers: Answer[] }) {
  const allSeniorities = [
    ...new Set(answers.map((answer) => answer.seniority).filter(Boolean)),
  ] as string[];
  const [selectedSeniority, setSelectedSeniority] = useState("All years @ co");
  const seniorityAnswers =
    selectedSeniority === "All years @ co"
      ? answers
      : answers.filter((answer) => answer.seniority === selectedSeniority);
  const trend = buildTrendData(seniorityAnswers, "seniority-category");

  useEffect(() => {
    if (
      selectedSeniority !== "All years @ co" &&
      !allSeniorities.includes(selectedSeniority)
    ) {
      setSelectedSeniority("All years @ co");
    }
  }, [allSeniorities, selectedSeniority]);

  return (
    <TrendChart
      title="Ratings trend by category and Years @ co"
      values={trend.periods}
      series={trend.series}
      secondaryFilter={{
        label: "Years @ co",
        value: selectedSeniority,
        options: ["All years @ co", ...allSeniorities],
        onChange: setSelectedSeniority,
      }}
    />
  );
}
