export default function ActivityFeed({ title, items, emptyLabel = "Nothing to show yet." }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>

      {items.length === 0 ? (
        <p className="stat-hint" style={{ marginTop: 14 }}>{emptyLabel}</p>
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id} className="activity-item">
              <div>
                <p className="activity-title">{item.title}</p>
                {item.subtitle && <p className="activity-subtitle">{item.subtitle}</p>}
              </div>
              {item.meta && <span className="activity-meta">{item.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
