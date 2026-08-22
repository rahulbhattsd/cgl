const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");

export default function Heatmap({ year, dataByDate, onSelect }) {
  return (
    <div>
      <div className="months-grid">
        {MONTH_NAMES.map((name, month) => {
          const total = daysInMonth(year, month);
          const firstDow = new Date(year, month, 1).getDay();
          const cells = [...Array(firstDow).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

          return (
            <div className="month-card" key={month}>
              <div className="month-title">{name}</div>
              <div className="month-dow-row">
                {DOW.map((d, i) => <span key={i} className="month-dow">{d}</span>)}
              </div>
              <div className="month-days-grid">
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} className="month-day-cell month-day-empty" />;
                  const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
                  const info = dataByDate[dateStr];
                  const level = info?.level ?? 0;
                  return (
                    <div
                      key={i}
                      className={`month-day-cell heat-${level}`}
                      title={`${dateStr} · ${info?.totalStudyMinutes || 0} min`}
                      onClick={() => onSelect(dateStr)}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
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
