const MS_DAY = 86400000;
const fmt = (d) => d.toISOString().slice(0, 10);

function buildYearGrid(year) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const startPad = start.getUTCDay();
  const gridStart = new Date(start.getTime() - startPad * MS_DAY);
  const days = [];
  let cur = gridStart;
  while (cur <= end || days.length % 7 !== 0) {
    days.push(fmt(cur));
    cur = new Date(cur.getTime() + MS_DAY);
    if (cur > end && days.length % 7 === 0) break;
  }
  return days;
}

export default function Heatmap({ year, dataByDate, onSelect }) {
  const days = buildYearGrid(year);
  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid">
        {days.map((date) => {
          const inYear = date.startsWith(String(year));
          const info = dataByDate[date];
          const level = inYear ? info?.level ?? 0 : -1;
          return (
            <div
              key={date}
              title={inYear ? `${date} · ${info?.totalStudyMinutes || 0} min` : ""}
              className={`heatmap-cell ${level >= 0 ? `heat-${level}` : ""}`}
              style={{ visibility: level < 0 ? "hidden" : "visible" }}
              onClick={() => inYear && onSelect(date)}
            />
          );
        })}
      </div>
      <div className="heat-legend">
        Less
        <span className="heatmap-cell heat-0" />
        <span className="heatmap-cell heat-1" />
        <span className="heatmap-cell heat-2" />
        <span className="heatmap-cell heat-3" />
        <span className="heatmap-cell heat-4" />
        More
      </div>
    </div>
  );
}
