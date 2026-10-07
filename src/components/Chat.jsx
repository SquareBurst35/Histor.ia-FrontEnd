import { useState, useRef, useEffect } from 'react';
import { chatStream } from '../api/client';

const MAX_HISTORY_MESSAGES = 20;
const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function Chat() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [streamingReply, setStreamingReply] = useState('');
  const [sources, setSources] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const historyRef = useRef(history);
  const isStreamingRef = useRef(isStreaming);
  // Reconhecimento de voz dispara fora do ciclo de render do React, então
  // guardamos a versão mais recente de sendMessage numa ref pra evitar closure
  // obsoleta (senão ele chamaria sempre a versão da primeira renderização).
  const sendMessageRef = useRef(() => {});

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingReply]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(message) {
    const trimmed = message.trim();
    if (!trimmed || isStreamingRef.current) return;

    setInput('');
    setError(null);
    setSources([]);
    setStreamingReply('');
    setIsStreaming(true);
    window.speechSynthesis?.cancel();

    const sentHistory = historyRef.current.slice(-MAX_HISTORY_MESSAGES);
    setHistory((prev) => [...prev, { role: 'user', content: trimmed }]);

    let fullReply = '';

    await chatStream(trimmed, sentHistory, {
      onToken: (text) => {
        fullReply += text;
        setStreamingReply(fullReply);
      },
      onSources: (marcos) => setSources(marcos),
      onDone: () => {
        setHistory((prev) => [...prev, { role: 'assistant', content: fullReply }]);
        setStreamingReply('');
        setIsStreaming(false);
        if (voiceReplyEnabled && speechSynthesisSupported && fullReply) {
          speak(fullReply);
        }
      },
      onError: (err) => {
        setError(err.message ?? 'O serviço de IA está indisponível no momento.');
        setIsStreaming(false);
        setStreamingReply('');
      },
    });
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function toggleListening() {
    if (!SpeechRecognitionImpl) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError('Não consegui ouvir — verifique a permissão do microfone.');
      }
    };
    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      setInput(transcript);
      if (isFinal) {
        sendMessageRef.current(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <div className="chat">
      <div className="chat__messages">
        {history.length === 0 && (
          <p className="chat__hint">
            {SpeechRecognitionImpl
              ? 'Toque no microfone e pergunte algo sobre a história da IA nos jogos — ex.: "como funcionavam os fantasmas do Pac-Man?"'
              : 'Pergunte algo sobre a história da IA nos jogos — ex.: "como funcionavam os fantasmas do Pac-Man?"'}
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
        {SpeechRecognitionImpl && (
          <button
            type="button"
            className={isListening ? 'chat__mic chat__mic--active' : 'chat__mic'}
            onClick={toggleListening}
            disabled={isStreaming}
            title={isListening ? 'Parar de ouvir' : 'Falar'}
          >
            🎤
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Ouvindo...' : 'Digite ou fale sua pergunta...'}
          maxLength={2000}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Enviar
        </button>
      </form>

      {speechSynthesisSupported && (
        <label className="chat__voice-toggle">
          <input
            type="checkbox"
            checked={voiceReplyEnabled}
            onChange={(e) => setVoiceReplyEnabled(e.target.checked)}
          />
          Ler respostas em voz alta
        </label>
      )}

      {!SpeechRecognitionImpl && (
        <p className="chat__voice-unsupported">
          Reconhecimento de voz não é suportado neste navegador — tente Chrome ou Edge.
        </p>
      )}
    </div>
  );
}
