import { areaScoreColor } from "../dashboard.utils";
import type { CategoryScore } from "../dashboard.types";

export function CategoryScores({ values }: { values: CategoryScore[] }) {
  return (
    <section className="card categories">
      <h2>Average by area</h2>
      {values.map((item) => (
        <div className="bar-row" key={item.name}>
          <span>{item.name}</span>
          <div>
            <i
              style={{
                width: `${(item.value / 4) * 100}%`,
                background: areaScoreColor(item.value),
              }}
            />
          </div>
          <b>{item.value.toFixed(1)}</b>
        </div>
      ))}
    </section>
  );
}
