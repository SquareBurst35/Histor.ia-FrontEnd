export default function TimelineList({ marcos, onSelect }) {
  if (marcos.length === 0) {
    return <p className="timeline-empty">Nenhum marco encontrado para essa era.</p>;
  }

  return (
    <ul className="timeline-list">
      {marcos.map((marco) => (
        <li key={marco.id} className="timeline-card" onClick={() => onSelect(marco.id)}>
          <span className="timeline-card__ano">{marco.ano}</span>
          <div className="timeline-card__body">
            <h3>{marco.titulo}</h3>
            <p>{marco.resumo}</p>
            <div className="timeline-card__tags">
              {marco.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
