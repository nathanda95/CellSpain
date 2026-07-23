export function MetricCard({
  label,
  value,
  sub,
  variation,
}: {
  label: string;
  value?: string;
  sub?: string;
  variation?: number;
}) {
  return (
    <section className="metric">
      <span>{label}</span>
      <strong>{value ?? "Data unavailable"}</strong>
      {variation != null && (
        <small
          className={`metric-variation ${
            variation > 0 ? "positive" : variation < 0 ? "negative" : "neutral"
          }`}
        >
          <span aria-hidden="true">{variation > 0 ? "↗" : variation < 0 ? "↘" : "→"}</span>
          {variation > 0 ? "+" : ""}
          {variation.toFixed(1)}% vs previous period
        </small>
      )}
      {sub && <small>{sub}</small>}
    </section>
  );
}
