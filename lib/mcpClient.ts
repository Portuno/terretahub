import { supabase } from './supabase';

let rpcId = 1;

export interface McpToolResult {
  data: Record<string, unknown> | null;
  error: string | null;
}

const parsePayload = (raw: string): McpToolResult => {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('event:')
    ? trimmed
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n')
    : trimmed;
  let body: any;
  try {
    body = JSON.parse(jsonText);
  } catch {
    return { data: null, error: 'La respuesta del asistente no se pudo leer.' };
  }
  if (body.error) {
    return { data: null, error: body.error.message || 'No se pudo completar la acción.' };
  }
  const text = body?.result?.content?.[0]?.text;
  if (typeof text !== 'string') {
    return { data: null, error: 'La herramienta no devolvió datos.' };
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    if (typeof data.error === 'string') return { data, error: data.error };
    return { data, error: null };
  } catch {
    return { data: null, error: 'La herramienta devolvió un texto que no es JSON.' };
  }
};

export const callMcpTool = async (
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId++,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const raw = await response.text();
  if (!response.ok && !raw) {
    return { data: null, error: 'El asistente no respondió.' };
  }
  return parsePayload(raw);
};
