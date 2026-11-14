import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  coldStart,
  eventDescription,
  reduceGuide,
  withResult,
  type GuideModel,
} from '../../lib/guideChat';
import { callMcpTool } from '../../lib/mcpClient';
import { trackProduct } from '../../lib/productAnalytics';
import type { AuthUser } from '../../types';

interface GuideChatProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export const GuideChat: React.FC<GuideChatProps> = ({ user, onOpenAuth }) => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<string[]>([]);
  const [model, setModel] = useState<GuideModel>(coldStart);
  const [text, setText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackProduct('abrir_chat');
    const loadZones = async () => {
      const { data } = await supabase.from('directory_zones').select('name').order('id');
      setZones((data || []).map((row: { name: string }) => row.name).filter(Boolean));
    };
    void loadZones();
  }, []);

  useEffect(() => {
    if (!user) return;
    const restore = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1);
      const existing = sessions?.[0]?.id as string | undefined;
      if (!existing) return;
      setSessionId(existing);
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', existing)
        .order('created_at', { ascending: true });
      const lastAssistant = [...(messages || [])].reverse().find((row: { role: string }) => row.role === 'assistant');
      if (lastAssistant) {
        setModel({
          ...coldStart(),
          state: 'resultado',
          message: lastAssistant.content,
          actions: [{ id: 'reset', label: 'Otra cosa' }],
        });
      }
    };
    void restore();
  }, [user?.id]);

  const remember = async (role: 'user' | 'assistant', content: string, tool?: string) => {
    if (!user || !content.trim()) return;
    let id = sessionId;
    if (!id) {
      const { data, error } = await supabase.from('chat_sessions').insert({ user_id: user.id }).select('id').single();
      if (error || !data) return;
      id = data.id as string;
      setSessionId(id);
    }
    await supabase.from('chat_messages').insert({
      session_id: id,
      user_id: user.id,
      role,
      content,
      tool: tool || null,
    });
  };

  const run = async (next: GuideModel) => {
    if (next.state !== 'ejecucion') return;
    setBusy(true);
    try {
      if (!user && next.lane === 'crear') {
        const done = withResult(next, { ok: false, note: 'Para crear hace falta un perfil.' });
        setModel({ ...done, actions: [{ id: 'crear-perfil', label: 'Crear perfil' }] });
        return;
      }
      if (next.lane === 'descubrir') {
        const today = new Date();
        const until = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const result = await callMcpTool('listar_eventos', {
          desde: today.toISOString(),
          hasta: until.toISOString(),
        });
        const items = Array.isArray(result.data?.quedadas) ? result.data?.quedadas as Array<Record<string, unknown>> : [];
        const top = items.slice(0, 3);
        const note = result.error
          ? result.error
          : top.length
            ? `Esta semana: ${top.map((item) => String(item.title || 'quedada')).join(', ')}.`
            : 'No hay quedadas publicadas en los próximos siete días.';
        const done = withResult(next, { ok: !result.error, note });
        if (top[0]?.slug && top[0]?.username) {
          done.actions = [
            { id: `abrir-evento:${top[0].username}/${top[0].slug}`, label: 'Ver la primera' },
            { id: 'reset', label: 'Otra cosa' },
          ];
        }
        setModel(done);
        await remember('assistant', done.message, 'listar_eventos');
        return;
      }
      if (next.lane === 'conectar') {
        const result = await callMcpTool('listar_comunidades', {});
        const items = Array.isArray(result.data?.comunidades) ? result.data?.comunidades as Array<Record<string, unknown>> : [];
        const top = items.slice(0, 3);
        const note = result.error
          ? result.error
          : top.length
            ? `Comunidades públicas: ${top.map((item) => String(item.name)).join(', ')}.`
            : 'No hay comunidades públicas para mostrar.';
        const done = withResult(next, { ok: !result.error, note });
        setModel(done);
        await remember('assistant', done.message, 'listar_comunidades');
        return;
      }
      if (next.kind === 'evento') {
        const draft = {
          title: next.event.title,
          description: eventDescription(next.event),
          date: next.event.date,
          time: next.event.time,
          zone: next.event.zone,
        };
        const proposed = await callMcpTool('proponer_evento', draft);
        const proposalId = proposed.data?.proposal_id;
        if (proposed.error || !proposalId) {
          const faltantes = Array.isArray(proposed.data?.faltantes) ? proposed.data?.faltantes.join(', ') : '';
          const done = withResult(next, {
            ok: false,
            note: proposed.error || `Faltan datos: ${faltantes}`,
          });
          setModel(done);
          return;
        }
        const created = await callMcpTool('crear_evento', {
          proposal_id: proposalId,
          borrador: asRecord(proposed.data?.borrador),
        });
        const done = withResult(next, {
          ok: !created.error,
          note: created.error || String(created.data?.nota || 'Quedada enviada a revisión.'),
          url: typeof created.data?.enlace === 'string' ? created.data.enlace : undefined,
        });
        setModel(done);
        if (!created.error) trackProduct('completar_creacion', { tipo: 'evento' });
        await remember('assistant', done.message, 'crear_evento');
        return;
      }
      if (next.kind === 'proyecto') {
        const draft = {
          name: next.project.name,
          slogan: next.project.slogan,
          description: next.project.description,
          need_summary: next.project.needSummary,
        };
        const proposed = await callMcpTool('proponer_proyecto', draft);
        const proposalId = proposed.data?.proposal_id;
        if (proposed.error || !proposalId) {
          const done = withResult(next, { ok: false, note: proposed.error || 'Faltan datos del proyecto.' });
          setModel(done);
          return;
        }
        const created = await callMcpTool('crear_proyecto', {
          proposal_id: proposalId,
          borrador: asRecord(proposed.data?.borrador),
        });
        const done = withResult(next, {
          ok: !created.error,
          note: created.error || String(created.data?.nota || 'Proyecto guardado.'),
          url: typeof created.data?.enlace === 'string' ? created.data.enlace : undefined,
        });
        setModel(done);
        if (!created.error) trackProduct('completar_creacion', { tipo: 'proyecto' });
        await remember('assistant', done.message, 'crear_proyecto');
      }
    } catch (error) {
      console.error('[GuideChat]', error);
      setModel(withResult(next, { ok: false, note: 'No pude hablar con el asistente.' }));
    } finally {
      setBusy(false);
    }
  };

  const apply = async (input: { text?: string; actionId?: string }) => {
    if (input.actionId === 'crear-perfil') {
      onOpenAuth();
      return;
    }
    if (input.actionId?.startsWith('abrir-evento:')) {
      navigate(`/evento/${input.actionId.slice('abrir-evento:'.length)}`);
      return;
    }
    if (input.actionId === 'abrir' && model.resultUrl) {
      navigate(model.resultUrl);
      return;
    }
    const label = input.text || model.actions.find((action) => action.id === input.actionId)?.label || input.actionId || '';
    const next = reduceGuide(model, input, { now: new Date(), zones });
    setModel(next);
    if (label) await remember('user', label);
    if (next.state === 'ejecucion') await run(next);
    else if (label) await remember('assistant', next.message);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-m-base text-terreta-dark">{busy ? 'Un momento.' : model.message}</p>
      {model.understood.length > 0 ? (
        <p className="text-m-sm text-terreta-secondary">Entendí: {model.understood.join(' · ')}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        {model.actions.slice(0, 3).map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            onClick={() => {
              void apply({ actionId: action.id });
            }}
            className="h-11 rounded-shell bg-terreta-accent/10 px-3 text-left text-m-sm font-semibold text-terreta-accent"
          >
            {action.label}
          </button>
        ))}
      </div>
      {model.state !== 'ejecucion' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = text.trim();
            if (!value) return;
            setText('');
            void apply({ text: value });
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="O escribí una frase"
            className="min-w-0 flex-1 rounded-shell border border-terreta-border bg-terreta-bg px-3 text-m-base text-terreta-dark"
          />
          <button type="submit" className="rounded-shell bg-terreta-accent px-3 text-m-sm text-white">
            Enviar
          </button>
        </form>
      ) : null}
    </div>
  );
};
