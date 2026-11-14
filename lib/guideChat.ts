export type GuideState =
  | 'idle'
  | 'intencion'
  | 'recoleccion'
  | 'propuesta'
  | 'confirmacion'
  | 'ejecucion'
  | 'resultado';

export type GuideLane = 'descubrir' | 'crear' | 'conectar';

export interface GuideAction {
  id: string;
  label: string;
}

export interface EventDraft {
  title?: string;
  date?: string;
  time?: string;
  zone?: string;
  description?: string;
}

export interface ProjectDraft {
  name?: string;
  slogan?: string;
  description?: string;
  needSummary?: string;
}

export interface GuideModel {
  state: GuideState;
  lane: GuideLane | null;
  kind: 'evento' | 'proyecto' | null;
  questionsAsked: number;
  event: EventDraft;
  project: ProjectDraft;
  understood: string[];
  message: string;
  actions: GuideAction[];
  editing: 'title' | 'slogan' | 'need' | null;
  resultUrl?: string;
}

export interface GuideContext {
  now: Date;
  zones: string[];
}

const WEEKDAYS: Array<[string, number]> = [
  ['domingo', 0],
  ['lunes', 1],
  ['martes', 2],
  ['miercoles', 3],
  ['jueves', 4],
  ['viernes', 5],
  ['sabado', 6],
];

export const fold = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const localIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const nextWeekday = (from: Date, weekday: number): string => {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
  let delta = (weekday - date.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  date.setDate(date.getDate() + delta);
  return localIso(date);
};

const weekdayIn = (text: string): number | null => {
  const folded = fold(text);
  for (const [name, day] of WEEKDAYS) {
    if (folded.includes(name)) return day;
  }
  return null;
};

const zoneIn = (text: string, zones: string[]): string | null => {
  const folded = fold(text);
  const sorted = [...zones].sort((a, b) => b.length - a.length);
  for (const zone of sorted) {
    if (zone && folded.includes(fold(zone))) return zone;
  }
  return null;
};

const timeIn = (text: string): string | null => {
  const match = text.match(/\b(\d{1,2})[:h](\d{2})\b/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const intentOf = (text: string): 'evento' | 'proyecto' | 'descubrir' | 'conectar' | null => {
  const folded = fold(text);
  if (folded.includes('proyecto')) return 'proyecto';
  if (/quedada|evento|organizar|juntada/.test(folded)) return 'evento';
  if (/comunidad|gente|conectar|persona/.test(folded)) return 'conectar';
  if (/semana|que pasa|agenda/.test(folded)) return 'descubrir';
  return null;
};

const blank = (): Pick<GuideModel, 'event' | 'project' | 'questionsAsked' | 'editing' | 'understood'> => ({
  event: {},
  project: {},
  questionsAsked: 0,
  editing: null,
  understood: [],
});

export const coldStart = (): GuideModel => ({
  state: 'idle',
  lane: null,
  kind: null,
  ...blank(),
  message: 'Elegí una de estas tres. No hace falta escribir todavía.',
  actions: [
    { id: 'lane:descubrir', label: 'Qué pasa esta semana en mi zona' },
    { id: 'lane:crear-quedada', label: 'Quiero organizar una quedada' },
    { id: 'lane:conectar', label: 'Busco gente o comunidades' },
  ],
});

const understoodOf = (model: GuideModel): string[] => {
  const lines: string[] = [];
  if (model.kind === 'evento') {
    if (model.event.date) lines.push(`Fecha ${model.event.date}`);
    if (model.event.title) lines.push(`Título «${model.event.title}»`);
    if (model.event.zone) lines.push(`Zona ${model.event.zone}`);
    if (model.event.time) lines.push(`Hora ${model.event.time}`);
  }
  if (model.kind === 'proyecto') {
    if (model.project.name) lines.push(`Proyecto «${model.project.name}»`);
    if (model.project.slogan) lines.push(`Frase «${model.project.slogan}»`);
  }
  return lines;
};

const withUnderstood = (model: GuideModel): GuideModel => ({
  ...model,
  understood: understoodOf(model),
});

const slotActions = (zones: string[]): GuideAction[] => {
  const picked = zones.filter(Boolean).slice(0, 2);
  const actions = picked.map((zone) => ({
    id: `slot:${zone}|19:00`,
    label: `${zone} · 19:00`,
  }));
  actions.push({ id: 'otra-hora', label: 'Otra hora' });
  return actions.slice(0, 3);
};

const askTitle = (model: GuideModel): GuideModel =>
  withUnderstood({
    ...model,
    state: 'recoleccion',
    lane: 'crear',
    kind: 'evento',
    questionsAsked: Math.max(model.questionsAsked, 1),
    editing: null,
    message: '¿Cómo se llama la quedada?',
    actions: [],
  });

const askSlots = (model: GuideModel, zones: string[]): GuideModel => {
  if (zones.length === 0) {
    return withUnderstood({
      ...model,
      state: 'recoleccion',
      questionsAsked: model.questionsAsked,
      message: 'No tengo zonas cargadas. No voy a inventar una.',
      actions: [{ id: 'lane:descubrir', label: 'Ver la semana sin filtrar' }],
    });
  }
  return withUnderstood({
    ...model,
    state: 'recoleccion',
    questionsAsked: Math.max(model.questionsAsked, 2),
    message: 'Elegí zona y hora. Si no está la tuya, usá otra hora y después la zona.',
    actions: slotActions(zones),
  });
};

export const eventDescription = (event: EventDraft): string => {
  if (event.description && event.description.trim().length >= 20) return event.description.trim();
  if (!event.title || !event.zone) return '';
  return `${event.title} es una quedada en ${event.zone}.`;
};

const eventReady = (event: EventDraft): boolean =>
  Boolean(event.title && event.date && event.time && event.zone && eventDescription(event).length >= 20);

const eventProposal = (model: GuideModel): GuideModel => {
  const event = model.event;
  const ready = eventReady(event);
  return withUnderstood({
    ...model,
    state: 'propuesta',
    editing: null,
    message: ready
      ? `Quedada «${event.title}» el ${event.date} a las ${event.time} en ${event.zone}. Texto: «${eventDescription(event)}». Se envía a revisión. No queda publicada sola.`
      : `Falta algún dato para enviarla: ${[
          !event.title ? 'título' : null,
          !event.date ? 'fecha' : null,
          !event.time ? 'hora' : null,
          !event.zone ? 'zona' : null,
        ].filter(Boolean).join(', ')}.`,
    actions: ready
      ? [
          { id: 'publicar', label: 'Publicar' },
          { id: 'editar', label: 'Editar' },
        ]
      : [{ id: 'editar', label: 'Editar' }],
  });
};

const projectReady = (project: ProjectDraft): boolean =>
  Boolean(project.name && (project.slogan || '').length >= 8 && (project.description || '').length >= 40);

const projectProposal = (model: GuideModel): GuideModel => {
  const project = model.project;
  const ready = projectReady(project);
  return withUnderstood({
    ...model,
    state: 'propuesta',
    editing: null,
    message: ready
      ? `Proyecto «${project.name}». Frase: ${project.slogan}. ${project.needSummary ? `Busca: ${project.needSummary}. ` : ''}Queda en borrador hasta que subas una imagen en el formulario, igual que hoy.`
      : 'Falta el nombre, una frase de al menos 8 caracteres o una descripción de al menos 40.',
    actions: ready
      ? [
          { id: 'publicar', label: 'Publicar' },
          { id: 'editar', label: 'Editar' },
        ]
      : [{ id: 'editar', label: 'Editar' }],
  });
};

const confirmOf = (model: GuideModel): GuideModel =>
  withUnderstood({
    ...model,
    state: 'confirmacion',
    message:
      model.kind === 'proyecto'
        ? 'Confirmo guardar el proyecto en borrador. No se publica solo.'
        : 'Confirmo el envío a revisión. No se publica hasta que administración lo apruebe.',
    actions: [
      { id: 'confirmar', label: 'Confirmar envío' },
      { id: 'volver', label: 'Volver' },
    ],
  });

const discoverModel = (): GuideModel => ({
  ...coldStart(),
  state: 'ejecucion',
  lane: 'descubrir',
  message: 'Miro la semana.',
  actions: [],
});

const connectModel = (): GuideModel => ({
  ...coldStart(),
  state: 'ejecucion',
  lane: 'conectar',
  message: 'Busco comunidades públicas y perfiles que eligieron mostrarse.',
  actions: [],
});

const applyEventText = (model: GuideModel, text: string, context: GuideContext): GuideModel => {
  const dateFromText = weekdayIn(text);
  const zone = zoneIn(text, context.zones);
  const time = timeIn(text);
  const next: GuideModel = {
    ...model,
    lane: 'crear',
    kind: 'evento',
    state: 'intencion',
    event: {
      ...model.event,
      date: dateFromText !== null ? nextWeekday(context.now, dateFromText) : model.event.date,
      zone: zone ?? model.event.zone,
      time: time ?? model.event.time,
    },
  };
  if (next.editing === 'title') {
    next.event = { ...next.event, title: text.trim() };
    next.editing = null;
    return eventReady(next.event) ? eventProposal(next) : askSlots(next, context.zones);
  }
  const opening =
    !model.event.title &&
    model.editing !== 'title' &&
    (model.state === 'idle' || model.state === 'intencion') &&
    intentOf(text) === 'evento';
  if (opening) {
    return askTitle({ ...next, questionsAsked: 1 });
  }
  if (!next.event.title) {
    next.event = { ...next.event, title: text.trim() };
    next.questionsAsked = Math.max(next.questionsAsked, 1);
  }
  if (eventReady(next.event)) return eventProposal(next);
  return askSlots(next, context.zones);
};

const applyProjectText = (model: GuideModel, text: string): GuideModel => {
  const trimmed = text.trim();
  if (!model.project.name || model.editing === 'title') {
    const next = {
      ...model,
      lane: 'crear' as const,
      kind: 'proyecto' as const,
      state: 'recoleccion' as const,
      questionsAsked: 1,
      editing: null,
      project: { ...model.project, name: trimmed },
    };
    return withUnderstood({
      ...next,
      message: '¿Cuál es la frase corta, de al menos 8 caracteres?',
      actions: [],
      questionsAsked: 2,
    });
  }
  if (!model.project.slogan || model.project.slogan.length < 8 || model.editing === 'slogan') {
    const next = {
      ...model,
      project: { ...model.project, slogan: trimmed },
      editing: null,
    };
    return withUnderstood({
      ...next,
      state: 'recoleccion',
      message: 'Contame en una frase de al menos 40 caracteres qué es y qué necesita.',
      actions: [],
      questionsAsked: 3,
    });
  }
  const next = {
    ...model,
    project: {
      ...model.project,
      description: trimmed,
      needSummary: trimmed.length <= 120 ? trimmed : undefined,
    },
    questionsAsked: 3,
    editing: null,
  };
  return projectProposal(next);
};

export const reduceGuide = (
  model: GuideModel,
  input: { text?: string; actionId?: string },
  context: GuideContext
): GuideModel => {
  const actionId = input.actionId;

  if (actionId === 'reset') return coldStart();
  if (actionId === 'lane:descubrir') return discoverModel();
  if (actionId === 'lane:conectar') return connectModel();
  if (actionId === 'lane:crear-quedada') {
    return askTitle({
      ...model,
      ...blank(),
      lane: 'crear',
      kind: 'evento',
      state: 'intencion',
      message: '',
      actions: [],
    });
  }
  if (actionId === 'lane:crear-proyecto') {
    return withUnderstood({
      ...model,
      ...blank(),
      state: 'recoleccion',
      lane: 'crear',
      kind: 'proyecto',
      questionsAsked: 1,
      message: '¿Cómo se llama el proyecto?',
      actions: [],
    });
  }

  if (actionId === 'publicar' && model.state === 'propuesta') return confirmOf(model);
  if (actionId === 'volver' && model.state === 'confirmacion') {
    return model.kind === 'proyecto' ? projectProposal(model) : eventProposal(model);
  }
  if (actionId === 'confirmar' && model.state === 'confirmacion') {
    return { ...model, state: 'ejecucion', message: 'Enviando.', actions: [] };
  }
  if (actionId === 'editar' && model.state === 'propuesta') {
    return withUnderstood({
      ...model,
      state: 'recoleccion',
      message: '¿Qué cambiamos?',
      actions: [
        { id: 'edit:title', label: model.kind === 'proyecto' ? 'Nombre' : 'Título' },
        { id: 'edit:place', label: model.kind === 'proyecto' ? 'Frase' : 'Zona y hora' },
      ],
    });
  }
  if (actionId === 'edit:title') {
    return { ...model, editing: 'title', state: 'recoleccion', message: 'Escribí el nuevo nombre.', actions: [] };
  }
  if (actionId === 'edit:place') {
    if (model.kind === 'proyecto') {
      return { ...model, editing: 'slogan', state: 'recoleccion', message: 'Escribí la frase corta.', actions: [] };
    }
    return askSlots(model, context.zones);
  }
  if (actionId === 'sin-necesidad') {
    return projectProposal(model);
  }
  if (actionId === 'otra-hora') {
    if (model.questionsAsked >= 3) return eventProposal(model);
    return withUnderstood({
      ...model,
      state: 'recoleccion',
      questionsAsked: 3,
      message: 'Elegí una hora.',
      actions: [
        { id: 'time:18:00', label: '18:00' },
        { id: 'time:19:00', label: '19:00' },
        { id: 'time:20:00', label: '20:00' },
      ],
    });
  }
  if (actionId?.startsWith('slot:')) {
    const body = actionId.slice('slot:'.length);
    const [zone, time] = body.split('|');
    const next = { ...model, event: { ...model.event, zone, time } };
    return eventProposal(next);
  }
  if (actionId?.startsWith('time:')) {
    const time = actionId.slice('time:'.length);
    const next = { ...model, event: { ...model.event, time } };
    if (!next.event.zone) {
      if (next.questionsAsked >= 3) return eventProposal(next);
      const zones = context.zones.slice(0, 3).map((zone) => ({ id: `zone:${zone}`, label: zone }));
      return withUnderstood({
        ...next,
        state: 'recoleccion',
        message: '¿En qué zona?',
        actions: zones,
      });
    }
    return eventProposal(next);
  }
  if (actionId?.startsWith('zone:')) {
    const zone = actionId.slice('zone:'.length);
    return eventProposal({ ...model, event: { ...model.event, zone } });
  }

  const text = (input.text || '').trim();
  if (!text) return model;

  if (model.state === 'idle' || model.lane === null) {
    const intent = intentOf(text);
    if (intent === 'descubrir') return discoverModel();
    if (intent === 'conectar') return connectModel();
    if (intent === 'proyecto') {
      return applyProjectText(
        { ...model, lane: 'crear', kind: 'proyecto', state: 'intencion', project: {} },
        text
      );
    }
    if (intent === 'evento') return applyEventText({ ...model, event: {} }, text, context);
    return {
      ...model,
      message: 'No me alcanza para eso. Elegí descubrir, crear o conectar.',
      actions: coldStart().actions,
    };
  }

  if (model.kind === 'evento') return applyEventText(model, text, context);
  if (model.kind === 'proyecto') return applyProjectText(model, text);
  return model;
};

export const withResult = (
  model: GuideModel,
  outcome: { ok: boolean; note: string; url?: string }
): GuideModel => ({
  ...model,
  state: 'resultado',
  message: outcome.note,
  resultUrl: outcome.url,
  actions: [
    { id: 'reset', label: 'Otra cosa' },
    ...(outcome.url ? [{ id: 'abrir', label: 'Abrir enlace' }] : []),
  ],
});
