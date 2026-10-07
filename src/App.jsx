import { useEffect, useState } from 'react';
import './App.css';
import { getEras, getTimeline, getMarco } from './api/client';
import EraFilter from './components/EraFilter';
import TimelineList from './components/TimelineList';
import MarcoDetail from './components/MarcoDetail';
import Chat from './components/Chat';

export default function App() {
  const [eras, setEras] = useState([]);
  const [selectedEra, setSelectedEra] = useState(null);
  const [marcos, setMarcos] = useState([]);
  const [selectedMarco, setSelectedMarco] = useState(null);
  const [marcoLoading, setMarcoLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEras()
      .then(setEras)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    getTimeline(selectedEra)
      .then(setMarcos)
      .catch((err) => setError(err.message));
  }, [selectedEra]);

  function handleSelectMarco(id) {
    setMarcoLoading(true);
    setSelectedMarco({ id });
    getMarco(id)
      .then((marco) => {
        setSelectedMarco(marco);
        setMarcoLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setMarcoLoading(false);
      });
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Histor.ia</h1>
        <p>A história da inteligência artificial nos jogos, contada por uma guia de museu.</p>
      </header>

      <main className="app__main">
        <section className="app__timeline">
          {error && <p className="error-text">{error}</p>}

          {selectedMarco ? (
            <MarcoDetail
              marco={selectedMarco?.titulo ? selectedMarco : null}
              loading={marcoLoading}
              onClose={() => setSelectedMarco(null)}
            />
          ) : (
            <>
              <EraFilter eras={eras} selectedEra={selectedEra} onSelect={setSelectedEra} />
              <TimelineList marcos={marcos} onSelect={handleSelectMarco} />
            </>
          )}
        </section>

        <section className="app__chat">
          <Chat />
        </section>
      </main>
    </div>
  );
}
