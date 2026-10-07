import { useState, useRef, useEffect } from 'react';
import { getHealth, chatStream } from '../api/client';
import Face from './Face';

const MAX_HISTORY_MESSAGES = 20;
const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function VoiceAssistant() {
  const [backendOnline, setBackendOnline] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const [showTextFallback, setShowTextFallback] = useState(!SpeechRecognitionImpl);
  const [textInput, setTextInput] = useState('');

  const recognitionRef = useRef(null);
  const historyRef = useRef([]);
  const isBusyRef = useRef(false);

  useEffect(() => {
    getHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function speak(text) {
    if (!speechSynthesisSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(message) {
    const trimmed = message.trim();
    if (!trimmed || isBusyRef.current) return;
    isBusyRef.current = true;

    setError(null);
    setQuestion(trimmed);
    setAnswer('');
    setSources([]);
    setIsStreaming(true);
    window.speechSynthesis?.cancel();

    const sentHistory = historyRef.current.slice(-MAX_HISTORY_MESSAGES);
    let fullReply = '';

    await chatStream(trimmed, sentHistory, {
      onToken: (text) => {
        fullReply += text;
        setAnswer(fullReply);
      },
      onSources: (marcos) => setSources(marcos),
      onDone: () => {
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: fullReply },
        ];
        setIsStreaming(false);
        isBusyRef.current = false;
        if (fullReply) speak(fullReply);
      },
      onError: (err) => {
        setError(err.message ?? 'O serviço de IA está indisponível no momento.');
        setIsStreaming(false);
        isBusyRef.current = false;
      },
    });
  }

  function toggleListening() {
    if (!SpeechRecognitionImpl || isBusyRef.current) return;

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
      setQuestion(transcript);
      if (isFinal) sendMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleTextSubmit(event) {
    event.preventDefault();
    sendMessage(textInput);
    setTextInput('');
  }

  const faceState = error
    ? 'error'
    : isListening
      ? 'listening'
      : isSpeaking
        ? 'speaking'
        : isStreaming
          ? 'thinking'
          : 'idle';

  const caption =
    error ||
    answer ||
    question ||
    (SpeechRecognitionImpl
      ? 'Toque no microfone e pergunte algo sobre a história da IA nos jogos.'
      : 'Digite sua pergunta sobre a história da IA nos jogos.');

  const micDisabled = isStreaming || isSpeaking || backendOnline === false;

  return (
    <div className="voice-assistant">
      {backendOnline === false && (
        <p className="voice-app__status error-text">
          Não consegui conectar ao servidor. Confira se o backend está rodando.
        </p>
      )}

      <Face state={faceState} />

      <p className={error ? 'voice-app__caption error-text' : 'voice-app__caption'}>{caption}</p>

      {sources.length > 0 && !isStreaming && (
        <p className="voice-app__sources">Baseado em: {sources.join(', ')}</p>
      )}

      {SpeechRecognitionImpl && (
        <button
          type="button"
          className={isListening ? 'mic-button mic-button--listening' : 'mic-button'}
          onClick={toggleListening}
          disabled={micDisabled}
          aria-label={isListening ? 'Parar de ouvir' : 'Falar'}
        >
          🎤
        </button>
      )}

      {SpeechRecognitionImpl && (
        <button
          type="button"
          className="voice-app__fallback-toggle"
          onClick={() => setShowTextFallback((v) => !v)}
        >
          {showTextFallback ? 'esconder teclado' : 'ou digite sua pergunta'}
        </button>
      )}

      {showTextFallback && (
        <form className="voice-app__fallback-form" onSubmit={handleTextSubmit}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            maxLength={2000}
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming || !textInput.trim()}>
            Enviar
          </button>
        </form>
      )}

      {!speechSynthesisSupported && (
        <p className="voice-app__status">
          Seu navegador não suporta leitura de voz — as respostas aparecem só em texto.
        </p>
      )}
    </div>
  );
}
