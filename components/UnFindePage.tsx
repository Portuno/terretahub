import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronDown, ChevronUp, X, Film, Radio, Sparkles, Package, Users, Mic, Gavel, Truck, Clock, Coffee, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import { Toast } from './Toast';

const EVENT_NAME = 'Un Finde en la Terreta';
const EVENT_CLAIM_ES = '54 horas de inmersión total para hackear el futuro de Valencia';
const EVENT_CLAIM_EN = '54 hours of total immersion to hack the future of Valencia';
const EVENT_DATE = '2026-07-03';
const EVENT_DATE_END = '2026-07-05';
const EVENT_VENUE_ES = 'Universidad de Valencia (UV) & La Marina, Valencia';
const EVENT_VENUE_EN = 'University of Valencia (UV) & La Marina, Valencia';

export type Lang = 'es' | 'en';

const STORAGE_LANG_KEY = 'unfinde_lang';

const getInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'es';
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    const browser = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
    return browser.toLowerCase().startsWith('es') ? 'es' : 'en';
  } catch {
    return 'es';
  }
};

const translations = {
  es: {
    nav: { concept: 'Concepto', tracks: 'Tracks', agenda: 'Agenda', logistics: 'Logística', sponsorship: 'Patrocinio' },
    header: { back: '← Volver' },
    hero: {
      badge: 'Terreta Hub presenta',
      claim: EVENT_CLAIM_ES,
      subtext: 'El motor de ejecución táctica de Terreta Hub. No reflexión, sino el "Hacer": preparación del terreno donde el talento local se hibrida con redes internacionales para convertir ideas volátiles en proyectos activos.',
      attend: 'Quiero participar',
      sponsor: 'Quiero ser sponsor',
      speaker: 'Speaker / Mentor / Jurado',
    },
    concept: {
      title: '¿Qué es Un Finde en la Terreta?',
      desc: 'Durante 54 horas, este Ideathon actúa como catalizador para la transformación consciente y coherente de Valencia. Siguiendo el marco conceptual del "Cuaderno Rojo", el proyecto se estructura bajo la lógica memética de "Parar - Curar - Gear": un proceso de tres pasos para recuperar la soberanía individual y creativa a través de la tecnología.',
      framehack: 'Frame Hack + Seis Sombreros',
      framehackDesc: 'El núcleo metodológico utiliza el "Frame Hack" (hackear el marco) integrado con la técnica de los "Seis Sombreros para Pensar" (De Bono) para optimizar la toma de decisiones y la producción en cada equipo.',
      parar: 'Parar',
      pararDesc: 'Detener el ruido sistémico. Identificar narrativas estancadas.',
      curar: 'Curar',
      curarDesc: 'Sanar procesos rotos. Validar ideas con datos reales.',
      gear: 'Gear',
      gearDesc: 'Activar el engranaje. Convertir ficción en realidad tangible.',
    },
    tracks: {
      title: 'Tracks de Contenido',
      cine: 'Cine',
      cineDesc: 'Festival "El Loco Lunes". Producción audiovisual que desafía los marcos establecidos.',
      streaming: 'Streaming',
      streamingDesc: '72 horas de transmisión en vivo (Making Off) documentando la "IA en la Terreta".',
      experiencias: 'Experiencias',
      experienciasDesc: 'Gestión de un "Calendario de Recuerdos" y mapeo de hitos emocionales.',
      productos: 'Productos',
      productosDesc: 'Generación de activos digitales y físicos, transformando la ficción en realidad.',
    },
    roles: {
      title: '¿Quién participa?',
      jefe: 'Jefe / Capo',
      jefeDesc: 'Supervisión 360° y asignación de "Misiones". Control de KPIs.',
      teniente: 'Teniente / Soldado',
      tenienteDesc: 'Ejecución de proyectos y actualización de estado en tiempo real.',
      sponsor: 'Sponsor',
      sponsorDesc: 'Acceso al ecosistema, leads calificados y dossier de impacto.',
      speaker: 'Speaker / Mentor',
      speakerDesc: 'Mentoría vertical en Tech, Negocio o Marketing.',
      jurado: 'Jurado / Logística',
      juradoDesc: 'Evaluación basada en datos y gestión de suministros (HITL).',
    },
    agenda: {
      title: 'Agenda',
      dayFri: 'Viernes 3',
      daySat: 'Sábado 4',
      daySun: 'Domingo 5',
      descFri: 'Apertura, networking, pitches de ideas, formación de equipos y primeras sesiones de Frame Hack.',
      descSat: 'Trabajo intensivo en equipos, mentoring vertical, producción de contenido y making off en streaming.',
      descSun: 'Últimos sprints, presentaciones ante jurado, premios y cierre con streaming final.',
      timeFri: '18:00 – 00:00',
      timeSat: '09:00 – 00:00',
      timeSun: '09:00 – 21:00',
    },
    logistics: {
      title: 'Logística e Información Práctica',
      venues: 'Sedes',
      venuesValue: 'Universidad de Valencia (UV) y La Marina. Áreas para Programar, Grabar, Comer/Socializar y Pitchear.',
      catering: 'Catering permanente',
      cateringValue: 'Agua, Café, Té y Mate disponibles 24h. Servicios programados de Desayuno, Almuerzo, Merienda y Cena.',
      bring: 'Qué llevar',
      bringValue: 'Portátil, cargadores y ganas de construir. Todo lo demás lo ponemos nosotros.',
      lang: 'Idioma',
      langValue: 'Español (con soporte en inglés para participantes internacionales).',
      age: 'Edad mínima',
      ageValue: '18 años (o 16 con autorización).',
      merch: 'Merchandising',
      merchMust: 'Remeras, Lapiceros, Stickers para todos los participantes.',
      merchWanted: 'Cuadernos, Pines, Tazas (edición limitada).',
    },
    countdown: { title: 'Cuenta atrás', days: 'Días', hours: 'Horas', min: 'Min', seg: 'Seg' },
    sponsor: {
      title: 'Patrocinio',
      intro: 'Visibilidad de marca, acceso al talento y al ecosistema creativo-tecnológico de Valencia. Presencia en 72h de streaming, comunicaciones y entradas incluidas.',
      cta: 'Quiero ser sponsor',
      benefitsBronze: ['Logo en web y streaming', 'Mención en redes', '2 entradas'],
      benefitsSilver: ['Todo Bronze', 'Logo en merchandising', '4 entradas', 'Stand en La Marina'],
      benefitsGold: ['Todo Silver', 'Logo principal', '8 entradas', 'Speaker slot', 'Co-branding en contenido'],
    },
    faq: [
      { q: '¿Necesito tener una idea propia?', a: 'No. Puedes traer una idea, unirte a un equipo existente o aportar tu talento (tech, diseño, negocio, audiovisual) a un proyecto.' },
      { q: '¿Puedo ir solo/a?', a: 'Sí. La mayoría de participantes llegan solos y forman equipos el viernes por la noche durante los pitches.' },
      { q: '¿Es solo para perfiles técnicos?', a: 'No. Buscamos equipos diversos: negocio, diseño, marketing, cine, IA y tech. Lo importante es las ganas de construir y hackear narrativas.' },
      { q: '¿Qué diferencia hay con un hackathon normal?', a: 'Usamos la metodología Frame Hack + Seis Sombreros de De Bono para ir más allá del código: hackeamos narrativas, producimos contenido audiovisual y generamos activos reales durante las 54 horas.' },
      { q: '¿Se puede participar en remoto?', a: 'El evento es presencial, pero el making off se transmite en vivo durante 72 horas. Participantes remotos pueden seguir el streaming y contribuir de forma asíncrona.' },
    ],
    toast: { error: 'Error al enviar. Intenta de nuevo.', attendeeOk: '¡Registro recibido! Te contactaremos pronto.', sponsorOk: '¡Solicitud recibida! Te contactaremos para concretar.', speakerOk: '¡Aplicación recibida! Revisaremos y te responderemos.' },
    meta: { title: 'Un Finde en la Terreta | 54h de Inmersión Total | Terreta Hub', description: '54 horas de inmersión total para hackear el futuro de Valencia. 3, 4 y 5 de Julio 2026. Ideathon, Frame Hack, Cine, Streaming y más.' },
    footer: { privacy: 'Política de Privacidad', terms: 'Términos y Condiciones', by: 'Plataforma creada por', accept: 'Al enviar cualquiera de los formularios aceptas nuestra' },
    modal: {
      close: 'Cerrar',
      attendee: 'Quiero participar',
      sponsor: 'Quiero ser sponsor',
      speaker: 'Speaker, Mentor o Jurado',
      submitError: 'No pudimos enviar. Intenta de nuevo.',
      name: 'Nombre',
      email: 'Email',
      role: 'Perfil',
      select: 'Selecciona',
      developer: 'Tech / Desarrollador/a',
      designer: 'Diseño / Audiovisual',
      business: 'Negocio / Marketing',
      cinema: 'Cine / Producción',
      other: 'Otro',
      specialNeeds: 'Necesidades especiales (opcional)',
      specialPlaceholder: 'Dietas, accesibilidad, etc.',
      submit: 'Enviar solicitud',
      sending: 'Enviando…',
      company: 'Empresa',
      contactPerson: 'Persona de contacto',
      budget: 'Presupuesto aproximado',
      message: 'Mensaje (opcional)',
      submitSponsor: 'Enviar solicitud de patrocinio',
      speakerRole: 'Rol al que aspiras *',
      mentor: 'Mentor/a',
      judge: 'Jurado',
      bio: 'Bio breve',
      experience: 'Experiencia relevante',
      links: 'Enlaces (LinkedIn, web)',
      submitSpeaker: 'Enviar aplicación',
      trackInterest: 'Track de interés',
      trackCine: 'Cine',
      trackStreaming: 'Streaming',
      trackExperiencias: 'Experiencias',
      trackProductos: 'Productos',
      trackAll: 'Cualquiera / Todos',
      placeholders: { name: 'Tu nombre', email: 'tu@email.com', company: 'Nombre de la empresa', contact: 'Nombre y apellidos', companyEmail: 'contacto@empresa.com', fullName: 'Nombre completo', bio: 'Quién eres y qué haces', experience: 'Startups, cine, IA, sector...', links: 'https://...', message: 'Interés, preguntas...' },
      budgetOptions: { bronze: 'Bronze (500€)', silver: 'Silver (1.200€)', gold: 'Gold (2.500€)', custom: 'Otro / Concertar llamada' },
    },
  },
  en: {
    nav: { concept: 'Concept', tracks: 'Tracks', agenda: 'Agenda', logistics: 'Logistics', sponsorship: 'Sponsorship' },
    header: { back: '← Back' },
    hero: {
      badge: 'Terreta Hub presents',
      claim: EVENT_CLAIM_EN,
      subtext: 'The tactical execution engine of Terreta Hub. Not reflection, but "Doing": ground preparation where local talent hybridizes with international networks to turn volatile ideas into active projects.',
      attend: 'I want to participate',
      sponsor: 'I want to be a sponsor',
      speaker: 'Speaker / Mentor / Jury',
    },
    concept: {
      title: 'What is Un Finde en la Terreta?',
      desc: 'During 54 hours, this Ideathon acts as a catalyst for the conscious and coherent transformation of Valencia. Following the "Red Notebook" conceptual framework, the project is structured under the memetic logic of "Stop - Heal - Gear": a three-step process to recover individual and creative sovereignty through technology.',
      framehack: 'Frame Hack + Six Hats',
      framehackDesc: 'The methodological core uses the "Frame Hack" (hacking the frame) integrated with De Bono\'s "Six Thinking Hats" technique to optimize decision-making and production in each team.',
      parar: 'Stop',
      pararDesc: 'Halt systemic noise. Identify stagnant narratives.',
      curar: 'Heal',
      curarDesc: 'Fix broken processes. Validate ideas with real data.',
      gear: 'Gear',
      gearDesc: 'Activate the engine. Turn fiction into tangible reality.',
    },
    tracks: {
      title: 'Content Tracks',
      cine: 'Cinema',
      cineDesc: '"El Loco Lunes" Festival. Audiovisual production that challenges established frameworks.',
      streaming: 'Streaming',
      streamingDesc: '72 hours of live broadcasting (Making Of) documenting "AI in La Terreta".',
      experiencias: 'Experiences',
      experienciasDesc: 'Managing a "Memory Calendar" and mapping emotional milestones.',
      productos: 'Products',
      productosDesc: 'Generation of digital and physical assets, turning fiction into reality.',
    },
    roles: {
      title: 'Who participates?',
      jefe: 'Chief / Capo',
      jefeDesc: '360° supervision and "Mission" assignment. KPI control.',
      teniente: 'Lieutenant / Soldier',
      tenienteDesc: 'Project execution and real-time status updates.',
      sponsor: 'Sponsor',
      sponsorDesc: 'Access to the ecosystem, qualified leads and impact dossier.',
      speaker: 'Speaker / Mentor',
      speakerDesc: 'Vertical mentoring in Tech, Business or Marketing.',
      jurado: 'Jury / Logistics',
      juradoDesc: 'Data-driven evaluation and supply management (HITL).',
    },
    agenda: {
      title: 'Agenda',
      dayFri: 'Friday 3rd',
      daySat: 'Saturday 4th',
      daySun: 'Sunday 5th',
      descFri: 'Opening, networking, idea pitches, team formation and first Frame Hack sessions.',
      descSat: 'Intensive team work, vertical mentoring, content production and live streaming making-of.',
      descSun: 'Final sprints, jury presentations, awards and closing with final stream.',
      timeFri: '18:00 – 00:00',
      timeSat: '09:00 – 00:00',
      timeSun: '09:00 – 21:00',
    },
    logistics: {
      title: 'Logistics & Practical Info',
      venues: 'Venues',
      venuesValue: 'University of Valencia (UV) and La Marina. Areas for Coding, Recording, Eating/Socializing and Pitching.',
      catering: 'Permanent catering',
      cateringValue: 'Water, Coffee, Tea and Mate available 24h. Scheduled Breakfast, Lunch, Snack and Dinner services.',
      bring: 'What to bring',
      bringValue: 'Laptop, chargers and a drive to build. We provide everything else.',
      lang: 'Language',
      langValue: 'Spanish (with English support for international participants).',
      age: 'Minimum age',
      ageValue: '18 (or 16 with authorization).',
      merch: 'Merchandising',
      merchMust: 'T-shirts, Pens, Stickers for all participants.',
      merchWanted: 'Notebooks, Pins, Mugs (limited edition).',
    },
    countdown: { title: 'Countdown', days: 'Days', hours: 'Hours', min: 'Min', seg: 'Sec' },
    sponsor: {
      title: 'Sponsorship',
      intro: 'Brand visibility, access to talent and Valencia\'s creative-tech ecosystem. Presence across 72h of streaming, communications and included tickets.',
      cta: 'I want to be a sponsor',
      benefitsBronze: ['Logo on web & streaming', 'Social media mention', '2 tickets'],
      benefitsSilver: ['All Bronze', 'Logo on merchandising', '4 tickets', 'Stand at La Marina'],
      benefitsGold: ['All Silver', 'Main logo', '8 tickets', 'Speaker slot', 'Co-branding on content'],
    },
    faq: [
      { q: 'Do I need to have my own idea?', a: 'No. You can bring an idea, join an existing team, or contribute your skills (tech, design, business, audiovisual) to a project.' },
      { q: 'Can I come alone?', a: 'Yes. Most participants arrive alone and form teams on Friday night during pitches.' },
      { q: 'Is it only for technical profiles?', a: 'No. We seek diverse teams: business, design, marketing, cinema, AI and tech. What matters is the drive to build and hack narratives.' },
      { q: 'What makes this different from a regular hackathon?', a: 'We use the Frame Hack + De Bono\'s Six Thinking Hats methodology to go beyond code: we hack narratives, produce audiovisual content and generate real assets during the 54 hours.' },
      { q: 'Can I participate remotely?', a: 'The event is in-person, but the making-of is broadcast live for 72 hours. Remote participants can follow the stream and contribute asynchronously.' },
    ],
    toast: { error: 'Error sending. Please try again.', attendeeOk: 'Registration received! We\'ll be in touch soon.', sponsorOk: 'Request received! We\'ll contact you to follow up.', speakerOk: 'Application received! We\'ll review and get back to you.' },
    meta: { title: 'Un Finde en la Terreta | 54h Total Immersion | Terreta Hub', description: '54 hours of total immersion to hack the future of Valencia. July 3-5, 2026. Ideathon, Frame Hack, Cinema, Streaming and more.' },
    footer: { privacy: 'Privacy Policy', terms: 'Terms and Conditions', by: 'Platform created by', accept: 'By submitting any form you accept our' },
    modal: {
      close: 'Close',
      attendee: 'I want to participate',
      sponsor: 'I want to be a sponsor',
      speaker: 'Speaker, Mentor or Jury',
      submitError: 'We couldn\'t send. Please try again.',
      name: 'Name',
      email: 'Email',
      role: 'Profile',
      select: 'Select',
      developer: 'Tech / Developer',
      designer: 'Design / Audiovisual',
      business: 'Business / Marketing',
      cinema: 'Cinema / Production',
      other: 'Other',
      specialNeeds: 'Special needs (optional)',
      specialPlaceholder: 'Diet, accessibility, etc.',
      submit: 'Submit request',
      sending: 'Sending…',
      company: 'Company',
      contactPerson: 'Contact person',
      budget: 'Approximate budget',
      message: 'Message (optional)',
      submitSponsor: 'Submit sponsorship request',
      speakerRole: 'Role you\'re applying for *',
      mentor: 'Mentor',
      judge: 'Jury',
      bio: 'Short bio',
      experience: 'Relevant experience',
      links: 'Links (LinkedIn, web)',
      submitSpeaker: 'Submit application',
      trackInterest: 'Track of interest',
      trackCine: 'Cinema',
      trackStreaming: 'Streaming',
      trackExperiencias: 'Experiences',
      trackProductos: 'Products',
      trackAll: 'Any / All',
      placeholders: { name: 'Your name', email: 'you@email.com', company: 'Company name', contact: 'Full name', companyEmail: 'contact@company.com', fullName: 'Full name', bio: 'Who you are and what you do', experience: 'Startups, cinema, AI, sector...', links: 'https://...', message: 'Interest, questions...' },
      budgetOptions: { bronze: 'Bronze (500€)', silver: 'Silver (1,200€)', gold: 'Gold (2,500€)', custom: 'Other / Schedule a call' },
    },
  },
} as const;

type T = typeof translations.es;

const formatEventDateRange = (start: string, end: string, locale: string): string => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const loc = locale === 'es' ? 'es-ES' : 'en-GB';
  return `${d1.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })} – ${d2.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })}`;
};

const getTimeLeft = (target: Date) => {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const Countdown: React.FC<{ eventDate: string; labels: { days: string; hours: string; min: string; seg: string } }> = ({ eventDate, labels }) => {
  const target = new Date(eventDate + 'T18:00:00');
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(t);
  }, [eventDate]);

  const items = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.min },
    { value: timeLeft.seconds, label: labels.seg },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
      {items.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center min-w-[70px]">
          <span className="text-3xl md:text-4xl font-bold text-terreta-accent tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs md:text-sm text-terreta-dark/70 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  );
};

const FaqSection: React.FC<{ items: Array<{ q: string; a: string }> }> = ({ items: faqItems }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const handleToggle = (index: number) => setOpenIndex((i) => (i === index ? null : index));

  return (
    <ul className="space-y-2">
      {faqItems.map((faq, index) => (
        <li key={index} className="border border-terreta-border rounded-lg overflow-hidden bg-terreta-card/50">
          <button
            type="button"
            onClick={() => handleToggle(index)}
            className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 text-terreta-dark font-medium hover:bg-terreta-border/20 transition-colors"
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
            id={`faq-question-${index}`}
            tabIndex={0}
          >
            <span>{faq.q}</span>
            {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <div
            id={`faq-answer-${index}`}
            role="region"
            aria-labelledby={`faq-question-${index}`}
            className={openIndex === index ? 'block px-4 pb-3 text-terreta-dark/80 text-sm' : 'hidden'}
          >
            {faq.a}
          </div>
        </li>
      ))}
    </ul>
  );
};

type RegistrationModalType = 'attendee' | 'sponsor' | 'speaker';

interface RegistrationModalProps {
  isOpen: boolean;
  type: RegistrationModalType | null;
  onClose: () => void;
  onAttendeeSubmit: (e: React.FormEvent) => Promise<void>;
  onSponsorSubmit: (e: React.FormEvent) => Promise<void>;
  onSpeakerSubmit: (e: React.FormEvent) => Promise<void>;
  t: T['modal'];
}

const INPUT_CLASS = 'w-full px-3 py-2 border border-terreta-border rounded-lg bg-terreta-card text-terreta-dark focus:ring-2 focus:ring-terreta-accent focus:border-terreta-accent outline-none';

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  type,
  onClose,
  onAttendeeSubmit,
  onSponsorSubmit,
  onSpeakerSubmit,
  t,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent, submitFn: (e: React.FormEvent) => Promise<void>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await submitFn(e);
      onClose();
    } catch {
      setError(t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !type) return null;

  const titles: Record<RegistrationModalType, string> = {
    attendee: t.attendee,
    sponsor: t.sponsor,
    speaker: t.speaker,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-terreta-border bg-terreta-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 p-4 border-b border-terreta-border bg-terreta-card z-10">
          <h2 id="registration-modal-title" className="font-serif text-xl font-bold text-terreta-dark">
            {titles[type]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-terreta-dark/70 hover:text-terreta-dark hover:bg-terreta-border/30 transition-colors"
            aria-label={t.close}
            tabIndex={0}
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 md:p-6">
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          {type === 'attendee' && (
            <form onSubmit={(e) => handleSubmit(e, onAttendeeSubmit)} className="space-y-4">
              <div>
                <label htmlFor="modal_attendee_name" className="block text-sm font-medium text-terreta-dark mb-1">{t.name} *</label>
                <input id="modal_attendee_name" name="attendee_name" type="text" required className={INPUT_CLASS} placeholder={t.placeholders.name} />
              </div>
              <div>
                <label htmlFor="modal_attendee_email" className="block text-sm font-medium text-terreta-dark mb-1">{t.email} *</label>
                <input id="modal_attendee_email" name="attendee_email" type="email" required className={INPUT_CLASS} placeholder={t.placeholders.email} />
              </div>
              <div>
                <label htmlFor="modal_attendee_role" className="block text-sm font-medium text-terreta-dark mb-1">{t.role}</label>
                <select id="modal_attendee_role" name="attendee_role" className={INPUT_CLASS}>
                  <option value="">{t.select}</option>
                  <option value="developer">{t.developer}</option>
                  <option value="designer">{t.designer}</option>
                  <option value="business">{t.business}</option>
                  <option value="cinema">{t.cinema}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_attendee_track" className="block text-sm font-medium text-terreta-dark mb-1">{t.trackInterest}</label>
                <select id="modal_attendee_track" name="attendee_track" className={INPUT_CLASS}>
                  <option value="">{t.select}</option>
                  <option value="cine">{t.trackCine}</option>
                  <option value="streaming">{t.trackStreaming}</option>
                  <option value="experiencias">{t.trackExperiencias}</option>
                  <option value="productos">{t.trackProductos}</option>
                  <option value="all">{t.trackAll}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_attendee_special" className="block text-sm font-medium text-terreta-dark mb-1">{t.specialNeeds}</label>
                <textarea id="modal_attendee_special" name="attendee_special" rows={2} className={INPUT_CLASS + ' resize-y'} placeholder={t.specialPlaceholder} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submit}
              </button>
            </form>
          )}
          {type === 'sponsor' && (
            <form onSubmit={(e) => handleSubmit(e, onSponsorSubmit)} className="space-y-4">
              <div>
                <label htmlFor="modal_sponsor_company" className="block text-sm font-medium text-terreta-dark mb-1">{t.company} *</label>
                <input id="modal_sponsor_company" name="sponsor_company" type="text" required className={INPUT_CLASS} placeholder={t.placeholders.company} />
              </div>
              <div>
                <label htmlFor="modal_sponsor_contact" className="block text-sm font-medium text-terreta-dark mb-1">{t.contactPerson} *</label>
                <input id="modal_sponsor_contact" name="sponsor_contact" type="text" required className={INPUT_CLASS} placeholder={t.placeholders.contact} />
              </div>
              <div>
                <label htmlFor="modal_sponsor_email" className="block text-sm font-medium text-terreta-dark mb-1">{t.email} *</label>
                <input id="modal_sponsor_email" name="sponsor_email" type="email" required className={INPUT_CLASS} placeholder={t.placeholders.companyEmail} />
              </div>
              <div>
                <label htmlFor="modal_sponsor_budget" className="block text-sm font-medium text-terreta-dark mb-1">{t.budget}</label>
                <select id="modal_sponsor_budget" name="sponsor_budget" className={INPUT_CLASS}>
                  <option value="">{t.select}</option>
                  <option value="bronze">{t.budgetOptions.bronze}</option>
                  <option value="silver">{t.budgetOptions.silver}</option>
                  <option value="gold">{t.budgetOptions.gold}</option>
                  <option value="custom">{t.budgetOptions.custom}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_sponsor_message" className="block text-sm font-medium text-terreta-dark mb-1">{t.message}</label>
                <textarea id="modal_sponsor_message" name="sponsor_message" rows={3} className={INPUT_CLASS + ' resize-y'} placeholder={t.placeholders.message} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submitSponsor}
              </button>
            </form>
          )}
          {type === 'speaker' && (
            <form onSubmit={(e) => handleSubmit(e, onSpeakerSubmit)} className="space-y-4">
              <div>
                <label htmlFor="modal_speaker_role" className="block text-sm font-medium text-terreta-dark mb-1">{t.speakerRole}</label>
                <select id="modal_speaker_role" name="speaker_role" required className={INPUT_CLASS}>
                  <option value="">{t.select}</option>
                  <option value="mentor">{t.mentor}</option>
                  <option value="speaker">Speaker</option>
                  <option value="judge">{t.judge}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_speaker_name" className="block text-sm font-medium text-terreta-dark mb-1">{t.name} *</label>
                <input id="modal_speaker_name" name="speaker_name" type="text" required className={INPUT_CLASS} placeholder={t.placeholders.fullName} />
              </div>
              <div>
                <label htmlFor="modal_speaker_email" className="block text-sm font-medium text-terreta-dark mb-1">{t.email} *</label>
                <input id="modal_speaker_email" name="speaker_email" type="email" required className={INPUT_CLASS} placeholder={t.placeholders.email} />
              </div>
              <div>
                <label htmlFor="modal_speaker_bio" className="block text-sm font-medium text-terreta-dark mb-1">{t.bio}</label>
                <textarea id="modal_speaker_bio" name="speaker_bio" rows={2} className={INPUT_CLASS + ' resize-y'} placeholder={t.placeholders.bio} />
              </div>
              <div>
                <label htmlFor="modal_speaker_experience" className="block text-sm font-medium text-terreta-dark mb-1">{t.experience}</label>
                <textarea id="modal_speaker_experience" name="speaker_experience" rows={3} className={INPUT_CLASS + ' resize-y'} placeholder={t.placeholders.experience} />
              </div>
              <div>
                <label htmlFor="modal_speaker_links" className="block text-sm font-medium text-terreta-dark mb-1">{t.links}</label>
                <input id="modal_speaker_links" name="speaker_links" type="url" className={INPUT_CLASS} placeholder={t.placeholders.links} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submitSpeaker}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const TrackCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="p-5 rounded-xl border border-terreta-border bg-terreta-bg hover:border-terreta-accent/40 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-terreta-accent/10 text-terreta-accent">{icon}</div>
      <h3 className="font-serif text-lg font-bold text-terreta-dark">{title}</h3>
    </div>
    <p className="text-sm text-terreta-dark/70 leading-relaxed">{desc}</p>
  </div>
);

const PhaseCard: React.FC<{ number: string; title: string; desc: string; accentClass: string }> = ({ number, title, desc, accentClass }) => (
  <div className="flex-1 min-w-[200px] p-5 rounded-xl border border-terreta-border bg-terreta-bg text-center">
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white mb-3 ${accentClass}`}>
      {number}
    </div>
    <h3 className="font-serif text-lg font-bold text-terreta-dark mb-2">{title}</h3>
    <p className="text-sm text-terreta-dark/70">{desc}</p>
  </div>
);

export const UnFindePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const t = translations[lang];
  const eventPlace = lang === 'es' ? EVENT_VENUE_ES : EVENT_VENUE_EN;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_LANG_KEY, lang); } catch { /* noop */ }
  }, [lang]);

  useDynamicMetaTags({
    title: t.meta.title,
    description: t.meta.description,
    url: '/unfinde',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: EVENT_NAME,
      description: lang === 'es' ? EVENT_CLAIM_ES : EVENT_CLAIM_EN,
      startDate: `${EVENT_DATE}T18:00:00+02:00`,
      endDate: `${EVENT_DATE_END}T21:00:00+02:00`,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: eventPlace },
      organizer: { '@type': 'Organization', name: 'Terreta Hub', url: 'https://terretahub.com' },
    },
  });

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [location.pathname, location.hash]);

  const showToastMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const handleAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.querySelector('[name="attendee_name"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="attendee_email"]') as HTMLInputElement)?.value?.trim();
    const role = (form.querySelector('[name="attendee_role"]') as HTMLSelectElement)?.value ?? '';
    const track = (form.querySelector('[name="attendee_track"]') as HTMLSelectElement)?.value ?? '';
    const specialNeeds = (form.querySelector('[name="attendee_special"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    if (!name || !email) return;
    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'attendee',
      payload: { name, email, role, track, specialNeeds },
      source: 'unfinde_terreta',
    });
    if (error) {
      showToastMsg(t.toast.error);
      throw new Error('Submit failed');
    }
    form.reset();
    showToastMsg(t.toast.attendeeOk);
  };

  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const company = (form.querySelector('[name="sponsor_company"]') as HTMLInputElement)?.value?.trim();
    const contactName = (form.querySelector('[name="sponsor_contact"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="sponsor_email"]') as HTMLInputElement)?.value?.trim();
    const budget = (form.querySelector('[name="sponsor_budget"]') as HTMLSelectElement)?.value ?? '';
    const message = (form.querySelector('[name="sponsor_message"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    if (!company || !contactName || !email) return;
    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'sponsor',
      payload: { company, contactName, email, budget, message },
      source: 'unfinde_terreta',
    });
    if (error) {
      showToastMsg(t.toast.error);
      throw new Error('Submit failed');
    }
    form.reset();
    showToastMsg(t.toast.sponsorOk);
  };

  const handleSpeakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const role = (form.querySelector('[name="speaker_role"]') as HTMLSelectElement)?.value ?? '';
    const name = (form.querySelector('[name="speaker_name"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="speaker_email"]') as HTMLInputElement)?.value?.trim();
    const bio = (form.querySelector('[name="speaker_bio"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const experience = (form.querySelector('[name="speaker_experience"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const links = (form.querySelector('[name="speaker_links"]') as HTMLInputElement)?.value?.trim() ?? '';
    if (!name || !email || !role) return;
    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'speaker',
      payload: { role, name, email, bio, experience, links },
      source: 'unfinde_terreta',
    });
    if (error) {
      showToastMsg(t.toast.error);
      throw new Error('Submit failed');
    }
    form.reset();
    showToastMsg(t.toast.speakerOk);
  };

  const [registrationModalType, setRegistrationModalType] = useState<RegistrationModalType | null>(null);

  return (
    <div className="min-h-screen bg-terreta-bg text-terreta-dark">
      <header className="sticky top-0 z-40 border-b border-terreta-border bg-terreta-bg/95 backdrop-blur supports-[backdrop-filter]:bg-terreta-bg/80">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            to="/"
            className="font-serif text-xl font-bold text-terreta-dark hover:text-terreta-accent transition-colors shrink-0"
            aria-label="Terreta Hub home"
          >
            Terreta Hub
          </Link>
          <nav className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Secciones del evento">
            {[
              { id: 'concepto', label: t.nav.concept },
              { id: 'tracks', label: t.nav.tracks },
              { id: 'agenda', label: t.nav.agenda },
              { id: 'logistica', label: t.nav.logistics },
              { id: 'sponsor', label: t.nav.sponsorship },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="text-sm font-medium text-terreta-dark/80 hover:text-terreta-accent transition-colors whitespace-nowrap"
                tabIndex={0}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex rounded-lg border border-terreta-border overflow-hidden bg-terreta-card/50">
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'es' ? 'bg-terreta-accent text-white' : 'text-terreta-dark/80 hover:text-terreta-dark hover:bg-terreta-border/30'}`}
                aria-pressed={lang === 'es'}
                aria-label="Español"
                tabIndex={0}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-terreta-accent text-white' : 'text-terreta-dark/80 hover:text-terreta-dark hover:bg-terreta-border/30'}`}
                aria-pressed={lang === 'en'}
                aria-label="English"
                tabIndex={0}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-semibold text-terreta-accent hover:text-terreta-dark transition-colors whitespace-nowrap"
              tabIndex={0}
              aria-label={t.header.back}
            >
              {t.header.back}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-14 md:py-20 text-center">
          <p className="text-sm uppercase tracking-widest text-terreta-accent font-semibold mb-3">
            {t.hero.badge}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-terreta-dark mb-3 leading-tight">
            {EVENT_NAME}
          </h1>
          <p className="text-xl md:text-2xl text-terreta-accent font-semibold mb-3">
            {t.hero.claim}
          </p>
          <p className="text-terreta-dark/75 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtext}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-terreta-dark/80 text-sm mb-10">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={18} aria-hidden /> {formatEventDateRange(EVENT_DATE, EVENT_DATE_END, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={18} aria-hidden /> {eventPlace}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={18} aria-hidden /> 54h
            </span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRegistrationModalType('attendee')}
              className="px-7 py-3.5 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
              tabIndex={0}
              aria-label={t.hero.attend}
            >
              {t.hero.attend}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="px-7 py-3.5 border-2 border-terreta-accent text-terreta-accent font-bold rounded-lg hover:bg-terreta-accent/10 transition-colors"
              tabIndex={0}
              aria-label={t.hero.sponsor}
            >
              {t.hero.sponsor}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('speaker')}
              className="px-7 py-3.5 border-2 border-terreta-dark/30 text-terreta-dark font-bold rounded-lg hover:bg-terreta-dark/5 transition-colors"
              tabIndex={0}
              aria-label={t.hero.speaker}
            >
              {t.hero.speaker}
            </button>
          </div>
        </section>

        {/* Concepto - Parar, Curar, Gear */}
        <section id="concepto" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.concept.title}</h2>
            <p className="text-terreta-dark/80 leading-relaxed mb-6 max-w-3xl">
              {t.concept.desc}
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <PhaseCard number="1" title={t.concept.parar} desc={t.concept.pararDesc} accentClass="bg-red-500" />
              <PhaseCard number="2" title={t.concept.curar} desc={t.concept.curarDesc} accentClass="bg-amber-500" />
              <PhaseCard number="3" title={t.concept.gear} desc={t.concept.gearDesc} accentClass="bg-emerald-500" />
            </div>
            <div className="p-5 rounded-xl border border-terreta-accent/30 bg-terreta-accent/5">
              <h3 className="font-serif text-lg font-bold text-terreta-accent mb-2">{t.concept.framehack}</h3>
              <p className="text-sm text-terreta-dark/80 leading-relaxed">{t.concept.framehackDesc}</p>
            </div>
          </div>
        </section>

        {/* Tracks de Contenido */}
        <section id="tracks" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.tracks.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <TrackCard icon={<Film size={22} />} title={t.tracks.cine} desc={t.tracks.cineDesc} />
              <TrackCard icon={<Radio size={22} />} title={t.tracks.streaming} desc={t.tracks.streamingDesc} />
              <TrackCard icon={<Sparkles size={22} />} title={t.tracks.experiencias} desc={t.tracks.experienciasDesc} />
              <TrackCard icon={<Package size={22} />} title={t.tracks.productos} desc={t.tracks.productosDesc} />
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.roles.title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Users size={20} />, title: t.roles.jefe, desc: t.roles.jefeDesc },
                { icon: <Users size={20} />, title: t.roles.teniente, desc: t.roles.tenienteDesc },
                { icon: <Package size={20} />, title: t.roles.sponsor, desc: t.roles.sponsorDesc },
                { icon: <Mic size={20} />, title: t.roles.speaker, desc: t.roles.speakerDesc },
                { icon: <Gavel size={20} />, title: t.roles.jurado, desc: t.roles.juradoDesc },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl border border-terreta-border bg-terreta-bg">
                  <div className="flex items-center gap-2 mb-2 text-terreta-accent">{icon}<h3 className="font-serif font-bold text-terreta-dark">{title}</h3></div>
                  <p className="text-sm text-terreta-dark/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agenda */}
        <section id="agenda" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.agenda.title}</h2>
            <ul className="space-y-4">
              {[
                { day: t.agenda.dayFri, time: t.agenda.timeFri, desc: t.agenda.descFri },
                { day: t.agenda.daySat, time: t.agenda.timeSat, desc: t.agenda.descSat },
                { day: t.agenda.daySun, time: t.agenda.timeSun, desc: t.agenda.descSun },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 p-5 rounded-xl border border-terreta-border bg-terreta-card/50">
                  <div className="flex-shrink-0 min-w-[100px]">
                    <span className="font-bold text-terreta-accent text-lg">{item.day}</span>
                    <p className="text-sm text-terreta-dark/60 mt-0.5">{item.time}</p>
                  </div>
                  <p className="text-terreta-dark/80 leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Logística */}
        <section id="logistica" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.logistics.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: <MapPin size={18} />, label: t.logistics.venues, value: t.logistics.venuesValue },
                { icon: <Coffee size={18} />, label: t.logistics.catering, value: t.logistics.cateringValue },
                { icon: <Utensils size={18} />, label: t.logistics.bring, value: t.logistics.bringValue },
                { icon: <Truck size={18} />, label: t.logistics.merch, value: `${t.logistics.merchMust} ${t.logistics.merchWanted}` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="p-4 rounded-xl border border-terreta-border bg-terreta-bg">
                  <div className="flex items-center gap-2 mb-2 text-terreta-accent">{icon}<span className="font-bold text-terreta-dark text-sm">{label}</span></div>
                  <p className="text-sm text-terreta-dark/70">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-terreta-border bg-terreta-bg">
                <span className="font-bold text-terreta-dark text-sm">{t.logistics.lang}</span>
                <p className="text-sm text-terreta-dark/70 mt-1">{t.logistics.langValue}</p>
              </div>
              <div className="p-4 rounded-xl border border-terreta-border bg-terreta-bg">
                <span className="font-bold text-terreta-dark text-sm">{t.logistics.age}</span>
                <p className="text-sm text-terreta-dark/70 mt-1">{t.logistics.ageValue}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section id="countdown" className="border-t border-terreta-border">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.countdown.title}</h2>
            <Countdown eventDate={EVENT_DATE} labels={t.countdown} />
          </div>
        </section>

        {/* Patrocinio */}
        <section id="sponsor" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t.sponsor.title}</h2>
            <p className="text-terreta-dark/80 mb-8 max-w-2xl">
              {t.sponsor.intro}
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { name: 'Bronze', price: '500', benefits: t.sponsor.benefitsBronze },
                { name: 'Silver', price: '1.200', benefits: t.sponsor.benefitsSilver },
                { name: 'Gold', price: '2.500', benefits: t.sponsor.benefitsGold },
              ].map((pkg) => (
                <div key={pkg.name} className="p-5 rounded-xl border border-terreta-border bg-terreta-bg hover:border-terreta-accent/40 transition-colors">
                  <h3 className="font-serif text-lg font-bold text-terreta-accent mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-terreta-dark mb-4">{pkg.price}€</p>
                  <ul className="text-sm text-terreta-dark/80 space-y-1.5">
                    {pkg.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-terreta-accent mt-0.5">•</span> {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="px-7 py-3.5 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              tabIndex={0}
              aria-label={t.sponsor.cta}
            >
              {t.sponsor.cta}
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">FAQ</h2>
            <FaqSection items={[...t.faq]} />
          </div>
        </section>

        {/* Footer legal */}
        <section className="border-t border-terreta-border bg-terreta-card/30">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-terreta-dark/70">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
              <Link to="/politica-de-privacidad" className="text-terreta-accent hover:underline">
                {t.footer.privacy}
              </Link>
              <span className="text-terreta-border/50 hidden sm:inline" aria-hidden>|</span>
              <Link to="/terminos-y-condiciones" className="text-terreta-accent hover:underline">
                {t.footer.terms}
              </Link>
            </div>
            <p className="mb-0 text-center sm:text-right">
              {t.footer.by}{' '}
              <a href="https://www.versaproducciones.com" target="_blank" rel="noopener noreferrer" className="text-terreta-dark/70 hover:text-terreta-accent transition-colors font-medium">
                Versa Producciones
              </a>
            </p>
          </div>
        </section>
      </main>

      <RegistrationModal
        isOpen={registrationModalType !== null}
        type={registrationModalType}
        onClose={() => setRegistrationModalType(null)}
        onAttendeeSubmit={handleAttendeeSubmit}
        onSponsorSubmit={handleSponsorSubmit}
        onSpeakerSubmit={handleSpeakerSubmit}
        t={t.modal}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          variant="terreta"
        />
      )}
    </div>
  );
};
