import type { SeniorityScore } from "../dashboard.types";

export function SeniorityAverageCard({ values }: { values: SeniorityScore[] }) {
  const scores = values.map((item) => item.value);
  const minimum = scores.length ? Math.min(...scores) : 0;
  const maximum = scores.length ? Math.max(...scores) : 4;
  const range = maximum - minimum;
  const padding = range === 0 ? 0.2 : Math.max(range * 0.12, 0.1);
  const domainMinimum = Math.max(0, Math.floor((minimum - padding) * 10) / 10);
  const domainMaximum = Math.min(4, Math.ceil((maximum + padding) * 10) / 10);
  const domainRange = domainMaximum - domainMinimum || 1;

  return (
    <section className="card service-card">
      <h2>Average by Years @ co</h2>
      {values.length ? (
        <div className="service-chart-body">
          <div className="service-y-axis" aria-hidden="true">
            <span>{domainMaximum.toFixed(1)}</span>
            <span>{((domainMaximum + domainMinimum) / 2).toFixed(1)}</span>
            <span>{domainMinimum.toFixed(1)}</span>
          </div>
          <div className="seniority">
            {values.map((item) => {
              const height = ((item.value - domainMinimum) / domainRange) * 100;
              return (
                <div key={item.name}>
                  <i style={{ height: `${height}%` }} />
                  <span>{item.name}</span>
                  <b>{item.value.toFixed(1)}</b>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="unavailable">No length-of-service data available.</p>
      )}
    </section>
  );
}
