const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, options) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const error = body?.error ?? { code: 'internal_error', message: 'Erro desconhecido.' };
    throw new ApiError(error.code, error.message, res.status);
  }

  return res.json();
}

export function getHealth() {
  return request('/health');
}

export function getEras() {
  return request('/eras');
}

export function getTimeline(era) {
  const query = era ? `?era=${encodeURIComponent(era)}` : '';
  return request(`/timeline${query}`);
}

export function getMarco(id) {
  return request(`/timeline/${encodeURIComponent(id)}`);
}

export function chatSync(message, history = []) {
  return request('/chat/sync', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

function parseSseEvent(raw) {
  let event = null;
  let data = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  return { event, data };
}

// SSE do POST /api/chat. EventSource não serve porque não suporta POST,
// então lemos o stream manualmente via fetch + ReadableStream.
export async function chatStream(message, history, { onToken, onSources, onDone, onError }) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
  } catch {
    onError?.({ code: 'llm_unavailable', message: 'Não foi possível conectar ao servidor.' });
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    onError?.(body?.error ?? { code: 'internal_error', message: 'Erro desconhecido.' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const { event, data } = parseSseEvent(rawEvent);
      if (!event) continue;
      const payload = data ? JSON.parse(data) : {};

      if (event === 'token') onToken?.(payload.text);
      else if (event === 'sources') onSources?.(payload.marcos ?? []);
      else if (event === 'done') onDone?.();
      else if (event === 'error') onError?.(payload);
    }
  }
}

export { ApiError };
