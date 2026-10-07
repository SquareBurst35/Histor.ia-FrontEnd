export default function MarcoDetail({ marco, loading, error, onClose }) {
  return (
    <div className="marco-detail">
      <button className="marco-detail__close" onClick={onClose}>
        ← Voltar para a linha do tempo
      </button>

      {loading && <p>Carregando...</p>}
      {error && <p className="error-text">{error}</p>}

      {marco && (
        <article>
          <header>
            <span className="marco-detail__ano">{marco.ano}</span>
            <h2>{marco.titulo}</h2>
            <p className="marco-detail__tecnica">{marco.tecnica}</p>
          </header>

          <p className="marco-detail__descricao">{marco.descricao}</p>

          <div className="timeline-card__tags">
            {marco.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          {marco.fontes?.length > 0 && (
            <footer>
              <h4>Fontes</h4>
              <ul>
                {marco.fontes.map((fonte) => (
                  <li key={fonte}>
                    <a href={fonte} target="_blank" rel="noreferrer">
                      {fonte}
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </article>
      )}
    </div>
  );
}
