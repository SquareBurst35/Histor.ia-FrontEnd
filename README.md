# Histor.ia — Frontend

Frontend do **Histor.ia**, projeto escolar sobre a história da inteligência
artificial nos jogos. Consome a API do
[`histor-ia-backend`](https://github.com/Tubysz/histor-ia-backend).

## Stack

- React 19 + Vite
- Sem bibliotecas de UI ou roteamento — CSS simples, navegação por estado
- Voz via **Web Speech API** do navegador (`SpeechRecognition` +
  `SpeechSynthesis`) — nada de servidor, nada de chave de API. Funciona em
  Chrome/Edge; suporte inconsistente em Firefox e Safari. O backend não tem
  (e não precisa ter) nada de áudio — é tudo feito no navegador.

## Rodando em dev

O backend precisa estar rodando em `http://localhost:8000` (veja o README do
`histor-ia-backend`).

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
│   └── client.js       # chamadas HTTP pro backend (health, eras, timeline, chat)
├── components/
│   ├── EraFilter.jsx
│   ├── TimelineList.jsx
│   ├── MarcoDetail.jsx
│   └── Chat.jsx         # chat com streaming via SSE + voz (STT/TTS do navegador)
├── App.jsx
└── main.jsx
```

## Contrato da API

Ver `docs/API.md` no repositório do backend. Resumo do que o front consome:

- `GET /api/eras` — eras pra montar os filtros
- `GET /api/timeline?era=` — lista de marcos (cards)
- `GET /api/timeline/{id}` — marco completo (página de detalhe)
- `POST /api/chat` — chat com streaming SSE (`event: token/sources/done/error`)

O frontend é responsável por guardar o histórico da conversa e mandá-lo em
cada requisição — o backend não guarda sessão.

## Comandos

```bash
npm run dev       # dev server
npm run build     # build de produção
npm run lint      # oxlint
```
