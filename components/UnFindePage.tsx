import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronDown, ChevronUp, X, Film, Radio, Sparkles, Package, Users, Mic, Gavel, Truck, Clock, Coffee, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import { Toast } from './Toast';
import { useTheme, type Theme } from '../context/ThemeContext';

const EVENT_NAME = 'Un Finde en la Terreta';
const EVENT_CLAIM_ES = 'Cada persona cuenta su Terreta';
const EVENT_CLAIM_EN = 'Every person tells their Terreta';
const EVENT_DATE = '2026-07-03';
const EVENT_DATE_END = '2026-07-05';
const EVENT_VENUE_ES = 'La Terreta';
const EVENT_VENUE_EN = 'La Terreta';

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
    nav: { concept: 'Festival', tracks: 'La experiencia', agenda: 'Edición Cine', logistics: 'Participar', sponsorship: 'Patrocinar' },
    header: { back: '← Volver' },
    hero: {
      badge: 'Terreta Hub presenta',
      claim: EVENT_CLAIM_ES,
      subtext: 'cine, streaming y experimentos interactivos',
      attend: 'Quiero participar',
      sponsor: 'Quiero ser sponsor',
      collaborate: 'Quiero colaborar',
      duration: '3 días',
      speaker: 'Speaker / Mentor / Jurado',
    },
    participate: {
      title: 'Participar',
      subtitle: 'Elegí tu rol y anotate en minutos.',
      cards: {
        attendee: {
          title: 'Participante',
          desc: 'Vení a producir: cortos, streaming y experimentos.',
          cta: 'Quiero participar',
        },
        sponsor: {
          title: 'Sponsor',
          desc: 'Impulsá el festival y conectá con talento audiovisual.',
          cta: 'Quiero ser sponsor',
        },
        collaborator: {
          title: 'Colaborador/a',
          desc: 'Sumá equipo: producción, difusión, voluntariado o soporte.',
          cta: 'Quiero colaborar',
        },
      },
    },
    themes: {
      title: 'Temas',
      subtitle: 'Cambiá el elemento para ajustar la estética.',
      tierra: {
        label: 'Tierra',
        desc: 'Raíz y territorio: foco comunitario y narrativa con raíces.',
        points: ['Frame Hack aplicado a decisiones humanas', 'Cine que muestra comunidad en acción'],
      },
      fuego: {
        label: 'Fuego',
        desc: 'Energía y acción: producción rápida y hackeo del frame.',
        points: ['Sprints intensos y montaje ágil', 'Momentos que escalan en minutos'],
      },
      aire: {
        label: 'Aire',
        desc: 'Conexión y redes: entrevistas, collabs y circulación de ideas.',
        points: ['Streaming con interacción y feedback', 'Colaboración entre equipos y canales'],
      },
      agua: {
        label: 'Agua',
        desc: 'Fluidez y experimentación: streaming y prototipos en vivo.',
        points: ['Making of continuo (en directo)', 'Videojuegos y experiencias interactivas'],
      },
    },
    concept: {
      title: '¿Qué es Un Finde en la Terreta?',
      desc: 'Durante el finde, este Ideathon actúa como catalizador para la transformación consciente y coherente de Valencia. Siguiendo el marco conceptual del "Cuaderno Rojo", el proyecto se estructura bajo la lógica memética de "Parar - Curar - Gear": un proceso de tres pasos para recuperar la soberanía individual y creativa a través de la tecnología.',
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
      title: 'Edición Festival de Cine',
      cine: 'Cortometrajes',
      cineDesc: 'Piezas creadas antes/durante/después: retrocausalidad y Frame Hack en acción.',
      streaming: 'Streaming & Making Of',
      streamingDesc: 'Cobertura en vivo: backstage, entrevistas y montaje en tiempo real.',
      experiencias: 'Experiencias',
      experienciasDesc: 'Gestión de un "Calendario de Recuerdos" y mapeo de hitos emocionales.',
      productos: 'Videojuegos y Experimentos',
      productosDesc: 'Prototipos interactivos y experiencias en vivo que expanden el frame.',
      reminder: 'Cada equipo cuenta su Terreta.',
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
      title: 'La experiencia',
      dayFri: 'Viernes',
      daySat: 'Sábado',
      daySun: 'Domingo',
      descFri: 'Catch-up, know-use y preproducción: sincronizamos equipos y elegimos la línea temporal.',
      descSat: 'Visualizaciones: feria de proyección ininterrumpida (cortos, streaming y experiencias interactivas).',
      descSun: 'Entrega de premios: cierre, validación y reconocimiento a la excelencia técnica audiovisual.',
      timeFri: '18:00',
      timeSat: '09:00',
      timeSun: '09:00',
    },
    logistics: {
      title: 'Logística e Información Práctica',
      venues: 'Sedes',
      venuesValue: 'La Terreta. Áreas para Programar, Grabar, Comer/Socializar y Pitchear.',
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
      intro: 'Visibilidad de marca y acceso al talento audiovisual de Valencia durante el festival.',
      cta: 'Quiero ser sponsor',
      benefitsBronze: ['Logo en web y streaming', 'Mención en redes'],
      benefitsSilver: ['Logo en merchandising', 'Stand en La Marina'],
      benefitsGold: ['Logo principal', 'Co-branding en contenido'],
    },
    faq: [
      { q: '¿Necesito saber de cine?', a: 'No. Podés venir con equipo, ideas o habilidades. Lo importante es construir y producir contenido audiovisual.' },
      { q: '¿Se puede ir solo/a?', a: 'Sí. El viernes se arman equipos con los pitches y el know-use.' },
      { q: '¿Qué se hace cada día?', a: 'Viernes: preproducción y Frame Hack. Sábado: visualizaciones. Domingo: premios y cierre.' },
      { q: '¿Cómo participo como sponsor o colaborador/a?', a: 'Elegí tu rol y completá el formulario. Te contactamos para coordinar.' },
    ],
    toast: { error: 'Error al enviar. Intenta de nuevo.', attendeeOk: '¡Registro recibido! Te contactaremos pronto.', sponsorOk: '¡Solicitud recibida! Te contactaremos para concretar.', collaboratorOk: '¡Solicitud recibida! Te contactaremos para coordinar.', speakerOk: '¡Aplicación recibida! Revisaremos y te responderemos.' },
    meta: { title: 'Un Finde en la Terreta | Festival Audiovisual | Terreta Hub', description: 'Cada persona cuenta su Terreta. A través del cine, el streaming y experimentos interactivos. 3, 4 y 5 de Julio 2026.' },
    footer: { privacy: 'Política de Privacidad', terms: 'Términos y Condiciones', by: 'Plataforma creada por', accept: 'Al enviar cualquiera de los formularios aceptas nuestra' },
    faqTitle: 'FAQ',
    modal: {
      close: 'Cerrar',
      attendee: 'Quiero participar',
      sponsor: 'Quiero ser sponsor',
      speaker: 'Speaker, Mentor o Jurado',
      collaborator: 'Quiero colaborar',
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
      collaboratorArea: 'Área de colaboración',
      submitCollaborator: 'Enviar solicitud de colaboración',
      collabTypes: {
        audiovisual: 'Audiovisual',
        production: 'Producción',
        communication: 'Comunicación',
        volunteering: 'Voluntariado',
        other: 'Otro',
      },
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
      placeholders: { name: 'Tu nombre', email: 'tu@email.com', company: 'Nombre de la empresa', contact: 'Nombre y apellidos', companyEmail: 'contacto@empresa.com', fullName: 'Nombre completo', bio: 'Quién eres y qué haces', experience: 'Startups, cine, IA, sector...', links: 'https://...', message: 'Interés, preguntas...', collabArea: 'Audiovisual, producción, comunicación...', collabMessage: 'Cuéntanos cómo querés colaborar...' },
      budgetOptions: { bronze: 'Opción 1', silver: 'Opción 2', gold: 'Opción 3', custom: 'Otro / Concertar llamada' },
    },
  },
  en: {
    nav: { concept: 'Festival', tracks: 'The experience', agenda: 'Film Edition', logistics: 'Participate', sponsorship: 'Sponsor' },
    header: { back: '← Back' },
    hero: {
      badge: 'Terreta Hub presents',
      claim: EVENT_CLAIM_EN,
      subtext: 'film, streaming and interactive experiments',
      attend: 'I want to participate',
      sponsor: 'I want to be a sponsor',
      collaborate: 'I want to collaborate',
      duration: '3 days',
      speaker: 'Speaker / Mentor / Jury',
    },
    participate: {
      title: 'Participate',
      subtitle: 'Choose your role and sign up in minutes.',
      cards: {
        attendee: {
          title: 'Participant',
          desc: 'Come to produce: shorts, streaming and interactive experiments.',
          cta: 'I want to participate',
        },
        sponsor: {
          title: 'Sponsor',
          desc: 'Boost the festival and connect with audiovisual talent.',
          cta: 'I want to be a sponsor',
        },
        collaborator: {
          title: 'Collaborator',
          desc: 'Join the team: production, communication, volunteering or support.',
          cta: 'I want to collaborate',
        },
      },
    },
    themes: {
      title: 'Themes',
      subtitle: 'Switch an element to change the aesthetic.',
      tierra: {
        label: 'Earth',
        desc: 'Roots and territory: community-first narrative and human decisions.',
        points: ['Frame Hack for human choices', 'Community stories in action'],
      },
      fuego: {
        label: 'Fire',
        desc: 'Energy and action: fast production and frame hacking.',
        points: ['Intense sprints and agile editing', 'Moments that scale in minutes'],
      },
      aire: {
        label: 'Air',
        desc: 'Connection and networks: interviews, collabs and idea circulation.',
        points: ['Streaming with interaction and feedback', 'Collaboration across teams and channels'],
      },
      agua: {
        label: 'Water',
        desc: 'Fluency and experimentation: streaming and live prototypes.',
        points: ['Continuous making-of (live)', 'Video games and interactive experiences'],
      },
    },
    concept: {
      title: 'What is Un Finde en la Terreta?',
      desc: 'During the weekend, this Ideathon acts as a catalyst for the conscious and coherent transformation of Valencia. Following the "Red Notebook" conceptual framework, the project is structured under the memetic logic of "Stop - Heal - Gear": a three-step process to recover individual and creative sovereignty through technology.',
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
      title: 'Film Festival Edition',
      cine: 'Short Films',
      cineDesc: 'Pieces created before/during/after: retrocausality and Frame Hack in action.',
      streaming: 'Streaming & Making Of',
      streamingDesc: 'Live coverage: backstage, interviews and real-time editing.',
      experiencias: 'Experiences',
      experienciasDesc: 'Managing a "Memory Calendar" and mapping emotional milestones.',
      productos: 'Video Games & Experiments',
      productosDesc: 'Interactive prototypes and live experiences that expand the frame.',
      reminder: 'Every team tells their Terreta.',
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
      title: 'The experience',
      dayFri: 'Friday',
      daySat: 'Saturday',
      daySun: 'Sunday',
      descFri: 'Catch-up, know-use and preproduction: we sync teams and pick the timeline permutation.',
      descSat: 'Visualizations: continuous projection hall (shorts, streaming and interactive experiences).',
      descSun: 'Awards day: wrap-up, validation and recognition for audiovisual technical excellence.',
      timeFri: '18:00',
      timeSat: '09:00',
      timeSun: '09:00',
    },
    logistics: {
      title: 'Logistics & Practical Info',
      venues: 'Venues',
      venuesValue: 'La Terreta. Areas for Coding, Recording, Eating/Socializing and Pitching.',
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
      intro: 'Brand visibility and access to Valencia audiovisual talent during the festival.',
      cta: 'I want to be a sponsor',
      benefitsBronze: ['Logo on web & streaming', 'Social media mention'],
      benefitsSilver: ['Logo on merchandising', 'Stand at La Marina'],
      benefitsGold: ['Main logo', 'Co-branding on content'],
    },
    faq: [
      { q: 'Do I need to know film?', a: 'No. You can come with a team, ideas or skills. The goal is to build and produce audiovisual content.' },
      { q: 'Can I come alone?', a: 'Yes. On Friday we form teams through pitches and know-use sessions.' },
      { q: 'What happens each day?', a: 'Friday: preproduction + Frame Hack. Saturday: visualizations. Sunday: awards and wrap-up.' },
      { q: 'How do I join as sponsor or collaborator?', a: 'Pick your role and complete the form. We will contact you to coordinate.' },
    ],
    toast: { error: 'Error sending. Please try again.', attendeeOk: 'Registration received! We\'ll be in touch soon.', sponsorOk: 'Request received! We\'ll contact you to follow up.', collaboratorOk: 'Request received! We\'ll contact you to coordinate.', speakerOk: 'Application received! We\'ll review and get back to you.' },
    meta: { title: 'Un Finde en la Terreta | Audiovisual Festival | Terreta Hub', description: 'Every person tells their Terreta. Through film, streaming and interactive experiments. July 3-5, 2026.' },
    footer: { privacy: 'Privacy Policy', terms: 'Terms and Conditions', by: 'Platform created by', accept: 'By submitting any form you accept our' },
    faqTitle: 'FAQ',
    modal: {
      close: 'Close',
      attendee: 'I want to participate',
      sponsor: 'I want to be a sponsor',
      speaker: 'Speaker, Mentor or Jury',
      collaborator: 'I want to collaborate',
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
      collaboratorArea: 'Collaboration area',
      submitCollaborator: 'Submit collaboration request',
      collabTypes: {
        audiovisual: 'Audiovisual',
        production: 'Production',
        communication: 'Communication',
        volunteering: 'Volunteering',
        other: 'Other',
      },
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
      placeholders: { name: 'Your name', email: 'you@email.com', company: 'Company name', contact: 'Full name', companyEmail: 'contact@company.com', fullName: 'Full name', bio: 'Who you are and what you do', experience: 'Startups, cinema, AI, sector...', links: 'https://...', message: 'Interest, questions...', collabArea: 'Audiovisual, production, communication...', collabMessage: 'Tell us how you want to collaborate...' },
      budgetOptions: { bronze: 'Option 1', silver: 'Option 2', gold: 'Option 3', custom: 'Other / Schedule a call' },
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

type RegistrationModalType = 'attendee' | 'sponsor' | 'speaker' | 'collaborator';

interface RegistrationModalProps {
  isOpen: boolean;
  type: RegistrationModalType | null;
  onClose: () => void;
  onAttendeeSubmit: (e: React.FormEvent) => Promise<void>;
  onSponsorSubmit: (e: React.FormEvent) => Promise<void>;
  onSpeakerSubmit: (e: React.FormEvent) => Promise<void>;
  onCollaboratorSubmit: (e: React.FormEvent) => Promise<void>;
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
  onCollaboratorSubmit,
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
    collaborator: t.collaborator,
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
                <label htmlFor="modal_sponsor_message" className="block text-sm font-medium text-terreta-dark mb-1">{t.message}</label>
                <textarea id="modal_sponsor_message" name="sponsor_message" rows={3} className={INPUT_CLASS + ' resize-y'} placeholder={t.placeholders.message} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submitSponsor}
              </button>
            </form>
          )}
          {type === 'collaborator' && (
            <form onSubmit={(e) => handleSubmit(e, onCollaboratorSubmit)} className="space-y-4">
              <div>
                <label htmlFor="modal_collab_name" className="block text-sm font-medium text-terreta-dark mb-1">{t.name} *</label>
                <input id="modal_collab_name" name="collab_name" type="text" required className={INPUT_CLASS} placeholder={t.placeholders.name} />
              </div>
              <div>
                <label htmlFor="modal_collab_email" className="block text-sm font-medium text-terreta-dark mb-1">{t.email} *</label>
                <input id="modal_collab_email" name="collab_email" type="email" required className={INPUT_CLASS} placeholder={t.placeholders.email} />
              </div>
              <div>
                <label htmlFor="modal_collab_area" className="block text-sm font-medium text-terreta-dark mb-1">{t.collaboratorArea}</label>
                <select id="modal_collab_area" name="collab_area" className={INPUT_CLASS} defaultValue="">
                  <option value="">{t.select}</option>
                  <option value="audiovisual">{t.collabTypes.audiovisual}</option>
                  <option value="production">{t.collabTypes.production}</option>
                  <option value="communication">{t.collabTypes.communication}</option>
                  <option value="volunteering">{t.collabTypes.volunteering}</option>
                  <option value="other">{t.collabTypes.other}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_collab_message" className="block text-sm font-medium text-terreta-dark mb-1">{t.message}</label>
                <textarea
                  id="modal_collab_message"
                  name="collab_message"
                  rows={3}
                  className={INPUT_CLASS + ' resize-y'}
                  placeholder={t.placeholders.collabMessage}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submitCollaborator}
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
  const { theme: activeTheme, setTheme } = useTheme();
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
    const message = (form.querySelector('[name="sponsor_message"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    if (!company || !contactName || !email) return;
    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'sponsor',
      payload: { company, contactName, email, message },
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

  const handleCollaboratorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.querySelector('[name="collab_name"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="collab_email"]') as HTMLInputElement)?.value?.trim();
    const area = (form.querySelector('[name="collab_area"]') as HTMLSelectElement)?.value ?? '';
    const message = (form.querySelector('[name="collab_message"]') as HTMLTextAreaElement)?.value?.trim() ?? '';

    if (!name || !email || !area) return;

    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'collaborator',
      payload: { name, email, area, message },
      source: 'unfinde_terreta',
    });

    if (error) {
      showToastMsg(t.toast.error);
      throw new Error('Submit failed');
    }

    form.reset();
    showToastMsg(t.toast.collaboratorOk);
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
              { id: 'festival', label: t.nav.concept },
              { id: 'experience', label: t.nav.tracks },
              { id: 'cine-edition', label: t.nav.agenda },
              { id: 'participate', label: t.nav.logistics },
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

      <main className="pb-24 md:pb-0">
        {/* Hero */}
        <section id="festival" className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
          <p className="text-sm uppercase tracking-widest text-terreta-accent font-semibold mb-3">
            {t.hero.badge}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-terreta-dark mb-3 leading-tight">
            {EVENT_NAME}
          </h1>
          <p className="text-xl md:text-2xl text-terreta-accent font-semibold mb-3">
            {t.hero.claim}
          </p>
          <p className="text-terreta-dark/75 mb-6 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            {t.hero.subtext}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-terreta-border bg-terreta-card/50">
              <Calendar size={18} aria-hidden /> <span className="font-semibold text-terreta-dark/80">{formatEventDateRange(EVENT_DATE, EVENT_DATE_END, lang)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-terreta-border bg-terreta-card/50">
              <MapPin size={18} aria-hidden /> <span className="font-semibold text-terreta-dark/80 text-sm text-center break-words leading-tight">{eventPlace}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => setRegistrationModalType('attendee')}
              className="w-full px-7 py-3.5 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              tabIndex={0}
              aria-label={t.hero.attend}
            >
              {t.hero.attend}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="w-full px-7 py-3.5 border border-terreta-accent/60 text-terreta-accent font-bold rounded-lg hover:bg-terreta-accent/10 transition-colors"
              tabIndex={0}
              aria-label={t.hero.sponsor}
            >
              {t.hero.sponsor}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('collaborator')}
              className="w-full px-7 py-3.5 border border-terreta-border/70 text-terreta-dark font-bold rounded-lg hover:bg-terreta-border/20 transition-colors"
              tabIndex={0}
              aria-label={t.hero.collaborate}
            >
              {t.hero.collaborate}
            </button>
          </div>
        </section>

        {/* Temas (Tierra/Fuego/Aire/Agua) */}
        <section id="themes" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold">{t.themes.title}</h2>
                <p className="text-terreta-dark/75 text-sm md:text-base mt-1">{t.themes.subtitle}</p>
              </div>
            </div>

            <div role="tablist" aria-label="Themes" className="flex gap-2 overflow-x-auto pb-2">
              {(['tierra', 'fuego', 'aire', 'agua'] as Theme[]).map((key) => {
                const isActive = activeTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTheme(key)}
                    className={[
                      'shrink-0 px-4 py-2 rounded-full border text-sm transition-colors',
                      isActive ? 'bg-terreta-accent text-white border-terreta-accent' : 'bg-terreta-bg/50 border-terreta-border/80 text-terreta-dark/80 hover:border-terreta-accent/60',
                    ].join(' ')}
                    tabIndex={0}
                    aria-label={t.themes[key].label}
                  >
                    {t.themes[key].label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-5 rounded-xl border border-terreta-border bg-terreta-bg">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-3 h-3 rounded-full bg-terreta-accent" aria-hidden />
                <h3 className="font-serif text-xl font-bold">{t.themes[activeTheme].label}</h3>
              </div>
              <p className="text-sm text-terreta-dark/80 leading-relaxed">{t.themes[activeTheme].desc}</p>
              <ul className="mt-3 space-y-1 text-sm text-terreta-dark/80">
                {t.themes[activeTheme].points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="text-terreta-accent mt-0.5" aria-hidden>
                      •
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Participar */}
        <section id="participate" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t.participate.title}</h2>
            <p className="text-terreta-dark/75 mb-6 max-w-2xl text-sm md:text-base">{t.participate.subtitle}</p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-terreta-border bg-terreta-bg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-terreta-accent/10 text-terreta-accent">
                    <Users size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-bold">{t.participate.cards.attendee.title}</h3>
                </div>
                <p className="text-sm text-terreta-dark/80 leading-relaxed mb-5">{t.participate.cards.attendee.desc}</p>
                <button
                  type="button"
                  onClick={() => setRegistrationModalType('attendee')}
                  className="w-full px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  tabIndex={0}
                  aria-label={t.participate.cards.attendee.cta}
                >
                  {t.participate.cards.attendee.cta}
                </button>
              </div>

              <div className="p-5 rounded-xl border border-terreta-border bg-terreta-bg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-terreta-accent/10 text-terreta-accent">
                    <Package size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-bold">{t.participate.cards.sponsor.title}</h3>
                </div>
                <p className="text-sm text-terreta-dark/80 leading-relaxed mb-5">{t.participate.cards.sponsor.desc}</p>
                <button
                  type="button"
                  onClick={() => setRegistrationModalType('sponsor')}
                  className="w-full px-6 py-3 border border-terreta-accent/60 text-terreta-accent font-bold rounded-lg hover:bg-terreta-accent/10 transition-colors"
                  tabIndex={0}
                  aria-label={t.participate.cards.sponsor.cta}
                >
                  {t.participate.cards.sponsor.cta}
                </button>
              </div>

              <div className="p-5 rounded-xl border border-terreta-border bg-terreta-bg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-terreta-accent/10 text-terreta-accent">
                    <Mic size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-bold">{t.participate.cards.collaborator.title}</h3>
                </div>
                <p className="text-sm text-terreta-dark/80 leading-relaxed mb-5">{t.participate.cards.collaborator.desc}</p>
                <button
                  type="button"
                  onClick={() => setRegistrationModalType('collaborator')}
                  className="w-full px-6 py-3 border border-terreta-border/70 text-terreta-dark font-bold rounded-lg hover:bg-terreta-border/20 transition-colors"
                  tabIndex={0}
                  aria-label={t.participate.cards.collaborator.cta}
                >
                  {t.participate.cards.collaborator.cta}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Concepto - Parar, Curar, Gear */}
        <section id="concepto" className="hidden border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
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
        <section id="cine-edition" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.tracks.title}</h2>
            <p className="text-terreta-dark/75 mb-6 max-w-2xl text-sm md:text-base mx-auto">
              {t.tracks.reminder}
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <TrackCard icon={<Film size={22} />} title={t.tracks.cine} desc={t.tracks.cineDesc} />
              <TrackCard icon={<Radio size={22} />} title={t.tracks.streaming} desc={t.tracks.streamingDesc} />
              <TrackCard icon={<Package size={22} />} title={t.tracks.productos} desc={t.tracks.productosDesc} />
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="hidden border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
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
        <section id="experience" className="border-t border-terreta-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.agenda.title}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: <Film size={20} />, day: t.agenda.dayFri, time: t.agenda.timeFri, desc: t.agenda.descFri },
                { icon: <Radio size={20} />, day: t.agenda.daySat, time: t.agenda.timeSat, desc: t.agenda.descSat },
                { icon: <Sparkles size={20} />, day: t.agenda.daySun, time: t.agenda.timeSun, desc: t.agenda.descSun },
              ].map(({ icon, day, time, desc }) => (
                <div key={day} className="p-5 rounded-xl border border-terreta-border bg-terreta-bg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-terreta-accent/10 text-terreta-accent">
                      {icon}
                    </div>
                    <div>
                      <div className="font-bold text-terreta-accent">{day}</div>
                      <div className="text-sm text-terreta-dark/70">{time}</div>
                    </div>
                  </div>
                  <p className="text-sm text-terreta-dark/80 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Logística */}
        <section id="logistica" className="hidden border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
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
        <section id="countdown" className="hidden border-t border-terreta-border">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.countdown.title}</h2>
            <Countdown eventDate={EVENT_DATE} labels={t.countdown} />
          </div>
        </section>

        {/* Patrocinio */}
        <section id="sponsor" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t.sponsor.title}</h2>
            <p className="text-terreta-dark/80 mb-6 max-w-2xl text-sm md:text-base">
              {t.sponsor.intro}
            </p>
            <div className="p-5 rounded-xl border border-terreta-border bg-terreta-bg mb-8">
              <ul className="text-sm text-terreta-dark/80 space-y-1.5">
                {Array.from(
                  new Set([
                    ...t.sponsor.benefitsBronze,
                    ...t.sponsor.benefitsSilver,
                    ...t.sponsor.benefitsGold,
                  ]),
                ).map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <span className="text-terreta-accent mt-0.5" aria-hidden>
                      •
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="w-full sm:w-auto px-7 py-3.5 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
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
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.faqTitle}</h2>
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
        onCollaboratorSubmit={handleCollaboratorSubmit}
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
