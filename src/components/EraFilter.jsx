export default function EraFilter({ eras, selectedEra, onSelect }) {
  return (
    <div className="era-filter">
      <button
        className={selectedEra === null ? 'era-tab era-tab--active' : 'era-tab'}
        onClick={() => onSelect(null)}
      >
        Todas
      </button>
      {eras.map((era) => (
        <button
          key={era.id}
          className={selectedEra === era.id ? 'era-tab era-tab--active' : 'era-tab'}
          onClick={() => onSelect(era.id)}
          title={era.descricao}
        >
          {era.nome} <span className="era-tab__periodo">{era.periodo}</span>
        </button>
      ))}
    </div>
  );
}
