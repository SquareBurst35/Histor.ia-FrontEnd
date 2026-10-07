import { useState, useRef, useEffect } from 'react';
import { chatStream } from '../api/client';

const MAX_HISTORY_MESSAGES = 20;

export default function Chat() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [streamingReply, setStreamingReply] = useState('');
  const [sources, setSources] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingReply]);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput('');
    setError(null);
    setSources([]);
    setStreamingReply('');
    setIsStreaming(true);

    const sentHistory = history.slice(-MAX_HISTORY_MESSAGES);
    setHistory((prev) => [...prev, { role: 'user', content: message }]);

    let fullReply = '';

    await chatStream(message, sentHistory, {
      onToken: (text) => {
        fullReply += text;
        setStreamingReply(fullReply);
      },
      onSources: (marcos) => setSources(marcos),
      onDone: () => {
        setHistory((prev) => [...prev, { role: 'assistant', content: fullReply }]);
        setStreamingReply('');
        setIsStreaming(false);
      },
      onError: (err) => {
        setError(err.message ?? 'O serviço de IA está indisponível no momento.');
        setIsStreaming(false);
        setStreamingReply('');
      },
    });
  }

  return (
    <div className="chat">
      <div className="chat__messages">
        {history.length === 0 && (
          <p className="chat__hint">
            Pergunte algo sobre a história da IA nos jogos — ex.: "como funcionavam os
            fantasmas do Pac-Man?"
          </p>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`chat__message chat__message--${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {isStreaming && (
          <div className="chat__message chat__message--assistant">
            {streamingReply || '...'}
          </div>
        )}

        {sources.length > 0 && (
          <div className="chat__sources">
            Marcos usados: {sources.join(', ')}
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <form className="chat__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          maxLength={2000}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
