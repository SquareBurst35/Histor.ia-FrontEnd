# Histor.ia — Frontend

Frontend do **Histor.ia**, projeto escolar sobre a história da inteligência
artificial nos jogos. Consome a API do
[`histor-ia-backend`](https://github.com/Tubysz/histor-ia-backend).

Experiência **só de voz**: um rosto animado no centro da tela, um botão de
microfone — toca, fala a pergunta, e a Histor.ia responde em voz alta com o
rosto animando enquanto fala. Sem timeline, sem lista de cards: é uma
assistente de voz, não um site pra navegar com o mouse.

## Stack

- React 19 + Vite
- Sem bibliotecas de UI ou roteamento — CSS simples, uma tela só
- Voz via **Web Speech API** do navegador (`SpeechRecognition` +
  `SpeechSynthesis`) — nada de servidor, nada de chave de API. Funciona em
  Chrome/Edge; suporte inconsistente em Firefox e Safari, e o
  reconhecimento de voz (`SpeechRecognition`) não funciona no Chromium
  "puro" do Linux — só no Google Chrome oficial. O backend não tem (e não
  precisa ter) nada de áudio — é tudo feito no navegador.
- Se o navegador não suportar reconhecimento de voz, aparece um campo de
  texto como alternativa (a resposta continua vindo em voz, só a pergunta
  precisa ser digitada).

## Rodando em dev

O backend precisa estar rodando em `http://localhost:8000`, com o Ollama
ativo (veja o README do `histor-ia-backend`).

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em `http://localhost:5173` (já liberado no CORS padrão do backend).

## Variáveis de ambiente

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Estrutura

```
src/
├── api/
│   └── client.js             # chamadas HTTP pro backend (health, chat)
├── components/
│   ├── Face.jsx               # rosto animado (SVG + CSS), estados: idle/listening/thinking/speaking/error
│   └── VoiceAssistant.jsx     # STT (fala→texto) + POST /api/chat (SSE) + TTS (texto→fala)
├── App.jsx
└── main.jsx
```

## Contrato da API

Ver `docs/API.md` no repositório do backend. O front consome só:

- `GET /api/health` — checagem de disponibilidade, mostrada se o backend cair
- `POST /api/chat` — chat com streaming SSE (`event: token/sources/done/error`)

O frontend guarda o histórico da conversa em memória (perdido ao recarregar
a página) e manda em cada requisição — o backend não guarda sessão.

## Comandos

```bash
npm run dev       # dev server
npm run build     # build de produção
npm run lint      # oxlint
```
