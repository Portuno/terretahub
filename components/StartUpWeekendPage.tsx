import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import { Toast } from './Toast';

// ========== Contenido editable (fechas, lugar, precios, textos) ==========
const EVENT_NAME = 'Techstars Startup Weekend Valencia';
const EVENT_CLAIM = '54 horas para lanzar tu próxima startup';
const EVENT_SUBTEXT = 'Para emprendedores, desarrolladores, diseñadores y cualquiera con ganas de validar una idea y conectar con el ecosistema.';
const EVENT_DATE = '2026-03-13'; // Viernes inicio (YYYY-MM-DD)
const EVENT_DATE_END = '2026-03-15'; // Domingo fin
const TICKET_PRICE = '45';
const TICKET_CURRENCY = '€';
const MAX_ATTENDEES = '80';
const TECHSTARS_URL = 'https://www.techstars.com/startup-weekend';

// ========== Idioma (ES / EN) ==========
export type Lang = 'es' | 'en';

const STORAGE_LANG_KEY = 'sw_lang';

const getInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    const browser = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
    return browser.toLowerCase().startsWith('es') ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

const translations = {
  es: {
    nav: { activities: 'Actividades', logistics: 'Logística', sponsorship: 'Patrocinio' },
    header: { back: '← Volver', langEs: 'Español', langEn: 'English' },
    hero: {
      event: 'Evento',
      claim: '54 horas para lanzar tu próxima startup',
      subtext: 'Para emprendedores, desarrolladores, diseñadores y cualquiera con ganas de validar una idea y conectar con el ecosistema.',
      attend: 'Quiero asistir',
      sponsor: 'Quiero ser sponsor',
      speaker: 'Quiero ser speaker / mentor',
    },
    activities: {
      title: '¿Qué es un Startup Weekend?',
      desc: 'Un evento de 54 horas (viernes a domingo) en el que equipos se forman el viernes con pitches de ideas, trabajan el sábado con mentores para construir un prototipo y validar el problema, y el domingo presentan ante un jurado. Es el formato oficial de Techstars, abierto a todo el mundo.',
      friday: 'Viernes: pitches, votación y formación de equipos',
      saturday: 'Sábado: mentoring y construcción del producto mínimo',
      sunday: 'Domingo: presentaciones finales y premios',
    },
    benefits: { title: 'Beneficios para asistentes', b1: 'Validar tu idea en un fin de semana', b2: 'Encontrar equipo o unirte a un proyecto', b3: 'Networking con mentores e inversores', b4: 'Acceso a premios y recursos del ecosistema', b5: 'Aprender haciendo con metodología probada' },
    agenda: { title: 'Agenda', dayFri: 'Viernes', daySat: 'Sábado', daySun: 'Domingo', descFri: 'Registro, networking, pitches de ideas y formación de equipos.', descSat: 'Trabajo en equipos, mentoring y construcción del prototipo.', descSun: 'Últimos ajustes, presentaciones ante jurado y premios.' },
    logistics: {
      title: 'Información práctica',
      lang: 'Idioma',
      langValue: 'Español',
      level: 'Nivel',
      levelValue: 'No se requiere experiencia previa; sí ganas de participar y aprender.',
      bring: 'Qué llevar',
      bringValue: 'Portátil, cargadores y documentación si la necesitas.',
      refunds: 'Reembolsos',
      refundsValue: 'Según política del evento (consultar al inscribirse).',
      age: 'Edad mínima',
      ageValue: '18 años (o 16 con autorización).',
    },
    mentors: { title: 'Mentores y jurado', text: 'Próximamente anunciaremos mentores, speakers y miembros del jurado. Si quieres formar parte, usa el formulario "Quiero ser speaker / mentor".' },
    camila: {
      title: 'Consultorio de Camila',
      intro: 'Se realizarán entrevistas profesionales a personas seleccionadas.',
      membersOnly: 'Actividad reservada para miembros de ',
      membersLink: 'Terreta Hub',
      membersOnlySuffix: '.',
      duration: 'Las entrevistas tendrán una duración de 10 a 20 minutos.',
      languages: 'Pueden realizarse en español e inglés.',
      authorize: 'Los participantes autorizan a que extractos de la entrevista se utilicen para la realización de un programa completo.',
    },
    partners: { title: 'Partners y sponsors', techstars: 'Este evento sigue el formato', local: 'Los sponsors locales se irán anunciando próximamente.' },
    countdown: { title: 'Cuenta atrás', days: 'Días', hours: 'Horas', min: 'Min', seg: 'Seg' },
    sponsor: {
      title: 'Patrocinio',
      intro: 'Visibilidad de marca, acceso al talento y a la comunidad emprendedora, presencia en comunicaciones y entradas incluidas. Paquetes orientativos:',
      cta: 'Quiero ser sponsor',
      benefitsBronze: ['Logo en web', 'Mención en redes', '2 entradas'],
      benefitsSilver: ['Todo Bronze', 'Logo en material del evento', '4 entradas', 'Stand'],
      benefitsGold: ['Todo Silver', 'Logo principal', '8 entradas', 'Speaker slot', 'Comunicación conjunta'],
    },
    footer: { eventFormat: 'es un evento que sigue el formato de', privacy: 'Política de Privacidad', terms: 'Términos y Condiciones', by: 'Plataforma creada por', accept: 'Al enviar cualquiera de los formularios aceptas nuestra' },
    modal: {
      close: 'Cerrar',
      attendee: 'Inscribirme como asistente',
      sponsor: 'Quiero ser sponsor',
      speaker: 'Speakers, mentores y jurado',
      submitError: 'No pudimos enviar. Intenta de nuevo.',
      attendeeIntro: 'Precio',
      attendeeIntro2: 'Incluye comidas, mentoring y espacio. Plazas limitadas',
      name: 'Nombre',
      email: 'Email',
      role: 'Rol aproximado',
      select: 'Selecciona',
      developer: 'Desarrollador/a',
      designer: 'Diseñador/a',
      business: 'Negocio / Marketing',
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
      judge: 'Juez / Jurado',
      bio: 'Bio breve',
      experience: 'Experiencia relevante',
      links: 'Enlaces (LinkedIn, web)',
      submitSpeaker: 'Enviar aplicación',
      placeholders: { name: 'Tu nombre', email: 'tu@email.com', company: 'Nombre de la empresa', contact: 'Nombre y apellidos', companyEmail: 'contacto@empresa.com', fullName: 'Nombre completo', bio: 'Quién eres y qué haces', experience: 'Startups, inversión, sector...', links: 'https://...', message: 'Interés, preguntas...' },
      budgetOptions: { bronze: 'Bronze (500€)', silver: 'Silver (1.200€)', gold: 'Gold (2.500€)', custom: 'Otro / Concertar llamada' },
    },
    faq: [
      { q: '¿Necesito tener una idea propia?', a: 'No. Puedes ir con una idea, unirte a un equipo con otra idea o simplemente aportar tu talento (diseño, código, negocio) a un proyecto.' },
      { q: '¿Puedo ir solo?', a: 'Sí. La mayoría de participantes llegan solos y forman equipos el viernes por la noche.' },
      { q: '¿Es solo para perfiles técnicos?', a: 'No. Buscamos equipos diversos: negocio, diseño, marketing y tech. Lo importante es las ganas de construir y validar.' },
      { q: '¿En qué idioma es el evento?', a: 'El evento se desarrolla en Español.' },
    ],
    toast: { error: 'Error al enviar. Intenta de nuevo.', attendeeOk: '¡Registro recibido! Te contactaremos pronto.', sponsorOk: '¡Solicitud recibida! Te contactaremos para concretar.', speakerOk: '¡Aplicación recibida! Revisaremos y te responderemos.' },
    meta: { title: 'Techstars Startup Weekend Valencia | Terreta Hub', description: '54 horas para lanzar tu próxima startup. Para emprendedores, desarrolladores y diseñadores. Valencia.' },
    eventPlace: 'Valencia (lugar por confirmar)',
  },
  en: {
    nav: { activities: 'Activities', logistics: 'Logistics', sponsorship: 'Sponsorship' },
    header: { back: '← Back', langEs: 'Español', langEn: 'English' },
    hero: {
      event: 'Event',
      claim: '54 hours to launch your next startup',
      subtext: 'For entrepreneurs, developers, designers and anyone eager to validate an idea and connect with the ecosystem.',
      attend: 'I want to attend',
      sponsor: 'I want to be a sponsor',
      speaker: 'I want to be a speaker / mentor',
    },
    activities: {
      title: 'What is a Startup Weekend?',
      desc: 'A 54-hour event (Friday to Sunday) where teams form on Friday with idea pitches, work on Saturday with mentors to build a prototype and validate the problem, and present to a jury on Sunday. It\'s the official Techstars format, open to everyone.',
      friday: 'Friday: pitches, voting and team formation',
      saturday: 'Saturday: mentoring and building the minimum product',
      sunday: 'Sunday: final presentations and prizes',
    },
    benefits: { title: 'Benefits for attendees', b1: 'Validate your idea in a weekend', b2: 'Find a team or join a project', b3: 'Networking with mentors and investors', b4: 'Access to prizes and ecosystem resources', b5: 'Learn by doing with a proven methodology' },
    agenda: { title: 'Agenda', dayFri: 'Friday', daySat: 'Saturday', daySun: 'Sunday', descFri: 'Registration, networking, idea pitches and team formation.', descSat: 'Team work, mentoring and building the prototype.', descSun: 'Final touches, jury presentations and prizes.' },
    logistics: {
      title: 'Practical information',
      lang: 'Language',
      langValue: 'Spanish',
      level: 'Level',
      levelValue: 'No prior experience required; just willingness to participate and learn.',
      bring: 'What to bring',
      bringValue: 'Laptop, chargers and any documentation you need.',
      refunds: 'Refunds',
      refundsValue: 'According to event policy (check when registering).',
      age: 'Minimum age',
      ageValue: '18 (or 16 with authorization).',
    },
    mentors: { title: 'Mentors and jury', text: 'We will announce mentors, speakers and jury members soon. If you want to take part, use the "I want to be a speaker / mentor" form.' },
    camila: {
      title: 'Consultorio de Camila',
      intro: 'Professional interviews will be conducted with selected participants.',
      membersOnly: 'Activity reserved for',
      membersLink: 'Terreta Hub',
      membersOnlySuffix: 'members.',
      duration: 'Interviews will last 10 to 20 minutes.',
      languages: 'They can be conducted in Spanish and English.',
      authorize: 'Participants authorize the use of excerpts for the production of a full programme.',
    },
    partners: { title: 'Partners and sponsors', techstars: 'This event follows the', local: 'Local sponsors will be announced soon.' },
    countdown: { title: 'Countdown', days: 'Days', hours: 'Hours', min: 'Min', seg: 'Sec' },
    sponsor: {
      title: 'Sponsorship',
      intro: 'Brand visibility, access to talent and the entrepreneurial community, presence in communications and included tickets. Indicative packages:',
      cta: 'I want to be a sponsor',
      benefitsBronze: ['Logo on web', 'Social media mention', '2 tickets'],
      benefitsSilver: ['All Bronze', 'Logo on event materials', '4 tickets', 'Stand'],
      benefitsGold: ['All Silver', 'Main logo', '8 tickets', 'Speaker slot', 'Joint communications'],
    },
    footer: { eventFormat: 'is an event that follows the format of', privacy: 'Privacy Policy', terms: 'Terms and Conditions', by: 'Platform created by', accept: 'By submitting any form you accept our' },
    modal: {
      close: 'Close',
      attendee: 'Register as attendee',
      sponsor: 'I want to be a sponsor',
      speaker: 'Speakers, mentors and jury',
      submitError: 'We couldn\'t send. Please try again.',
      attendeeIntro: 'Price',
      attendeeIntro2: 'Includes meals, mentoring and space. Limited places',
      name: 'Name',
      email: 'Email',
      role: 'Approximate role',
      select: 'Select',
      developer: 'Developer',
      designer: 'Designer',
      business: 'Business / Marketing',
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
      judge: 'Judge / Jury',
      bio: 'Short bio',
      experience: 'Relevant experience',
      links: 'Links (LinkedIn, web)',
      submitSpeaker: 'Submit application',
      placeholders: { name: 'Your name', email: 'you@email.com', company: 'Company name', contact: 'Full name', companyEmail: 'contact@company.com', fullName: 'Full name', bio: 'Who you are and what you do', experience: 'Startups, investment, sector...', links: 'https://...', message: 'Interest, questions...' },
      budgetOptions: { bronze: 'Bronze (500€)', silver: 'Silver (1,200€)', gold: 'Gold (2,500€)', custom: 'Other / Schedule a call' },
    },
    faq: [
      { q: 'Do I need to have my own idea?', a: 'No. You can come with an idea, join a team with another idea, or simply contribute your skills (design, code, business) to a project.' },
      { q: 'Can I come alone?', a: 'Yes. Most participants come alone and form teams on Friday night.' },
      { q: 'Is it only for technical profiles?', a: 'No. We look for diverse teams: business, design, marketing and tech. What matters is the drive to build and validate.' },
      { q: 'What language is the event in?', a: 'The event is run in Spanish.' },
    ],
    toast: { error: 'Error sending. Please try again.', attendeeOk: 'Registration received! We\'ll be in touch soon.', sponsorOk: 'Request received! We\'ll contact you to follow up.', speakerOk: 'Application received! We\'ll review and get back to you.' },
    meta: { title: 'Techstars Startup Weekend Valencia | Terreta Hub', description: '54 hours to launch your next startup. For entrepreneurs, developers and designers. Valencia.' },
    eventPlace: 'Valencia (venue TBC)',
  },
} as const;

type T = typeof translations.es;

const formatEventDateRange = (start: string, end: string, locale: string): string => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const loc = locale === 'es' ? 'es-ES' : 'en-GB';
  return `${d1.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })} – ${d2.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })}`;
};

// ========== Countdown ==========
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

// ========== FAQ acordeón ==========
const FaqAttendees: React.FC<{ items: Array<{ q: string; a: string }> }> = ({ items: faqItems }) => {
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
              <p className="text-sm text-terreta-dark/70 mb-2">{t.attendeeIntro}: {TICKET_PRICE}{TICKET_CURRENCY}. {t.attendeeIntro2} ({MAX_ATTENDEES}).</p>
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
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal_attendee_special" className="block text-sm font-medium text-terreta-dark mb-1">{t.specialNeeds}</label>
                <textarea id="modal_attendee_special" name="attendee_special" rows={2} className={INPUT_CLASS + ' resize-y'} placeholder={t.specialPlaceholder} />
              </div>
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
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
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
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
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
                {isSubmitting ? t.sending : t.submitSpeaker}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== Main page ==========
export const StartUpWeekendPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {}
  }, [lang]);

  useDynamicMetaTags({
    title: t.meta.title,
    description: t.meta.description,
    url: '/StartUpWeekend',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: EVENT_NAME,
      description: EVENT_CLAIM,
      startDate: `${EVENT_DATE}T18:00:00+01:00`,
      endDate: `${EVENT_DATE_END}T21:00:00+01:00`,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: t.eventPlace },
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

  const handleAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.querySelector('[name="attendee_name"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="attendee_email"]') as HTMLInputElement)?.value?.trim();
    const role = (form.querySelector('[name="attendee_role"]') as HTMLSelectElement)?.value ?? '';
    const specialNeeds = (form.querySelector('[name="attendee_special"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    if (!name || !email) return;
    const { error } = await supabase.from('startup_weekend_registrations').insert({
      type: 'attendee',
      payload: { name, email, role, specialNeeds },
      source: 'terretahub_landing',
    });
    if (error) {
      setToastMessage(t.toast.error);
      setShowToast(true);
      throw new Error('Submit failed');
    }
    form.reset();
    setToastMessage(t.toast.attendeeOk);
    setShowToast(true);
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
      source: 'terretahub_landing',
    });
    if (error) {
      setToastMessage(t.toast.error);
      setShowToast(true);
      throw new Error('Submit failed');
    }
    form.reset();
    setToastMessage(t.toast.sponsorOk);
    setShowToast(true);
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
      source: 'terretahub_landing',
    });
    if (error) {
      setToastMessage(t.toast.error);
      setShowToast(true);
      throw new Error('Submit failed');
    }
    form.reset();
    setToastMessage(t.toast.speakerOk);
    setShowToast(true);
  };

  const [registrationModalType, setRegistrationModalType] = useState<RegistrationModalType | null>(null);

  return (
    <div className="min-h-screen bg-terreta-bg text-terreta-dark">
      {/* Header — todo en una línea */}
      <header className="sticky top-0 z-40 border-b border-terreta-border bg-terreta-bg/95 backdrop-blur supports-[backdrop-filter]:bg-terreta-bg/80">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            to="/"
            className="font-serif text-xl font-bold text-terreta-dark hover:text-terreta-accent transition-colors shrink-0"
          >
            Terreta Hub
          </Link>
          <nav className="flex items-center gap-4 md:gap-6" aria-label="Secciones del evento">
            <button
              type="button"
              onClick={() => scrollToSection('actividades')}
              className="text-sm font-medium text-terreta-dark/80 hover:text-terreta-accent transition-colors whitespace-nowrap"
            >
              {t.nav.activities}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sponsor')}
              className="text-sm font-medium text-terreta-dark/80 hover:text-terreta-accent transition-colors whitespace-nowrap"
            >
              {t.nav.sponsorship}
            </button>
          </nav>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex rounded-lg border border-terreta-border overflow-hidden bg-terreta-card/50">
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'es' ? 'bg-terreta-accent text-white' : 'text-terreta-dark/80 hover:text-terreta-dark hover:bg-terreta-border/30'}`}
                aria-pressed={lang === 'es'}
                aria-label="Español"
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-terreta-accent text-white' : 'text-terreta-dark/80 hover:text-terreta-dark hover:bg-terreta-border/30'}`}
                aria-pressed={lang === 'en'}
                aria-label="English"
              >
                EN
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-semibold text-terreta-accent hover:text-terreta-dark transition-colors whitespace-nowrap"
            >
              {t.header.back}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
          <p className="text-sm uppercase tracking-wider text-terreta-accent font-semibold mb-2">
            {t.hero.event}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-terreta-dark mb-4">
            {EVENT_NAME}
          </h1>
          <p className="text-xl md:text-2xl text-terreta-accent font-semibold mb-2">
            {t.hero.claim}
          </p>
          <p className="text-terreta-dark/80 mb-6 max-w-2xl mx-auto">
            {t.hero.subtext}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-terreta-dark/80 text-sm mb-8">
            <span className="inline-flex items-center gap-1">
              <Calendar size={18} aria-hidden /> {formatEventDateRange(EVENT_DATE, EVENT_DATE_END, lang)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={18} aria-hidden /> {t.eventPlace}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRegistrationModalType('attendee')}
              className="px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              {t.hero.attend}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="px-6 py-3 border-2 border-terreta-accent text-terreta-accent font-bold rounded-lg hover:bg-terreta-accent/10 transition-colors"
            >
              {t.hero.sponsor}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationModalType('speaker')}
              className="px-6 py-3 border-2 border-terreta-dark/40 text-terreta-dark font-bold rounded-lg hover:bg-terreta-dark/5 transition-colors"
            >
              {t.hero.speaker}
            </button>
          </div>
        </section>

        {/* Actividades (qué es, beneficios, agenda) */}
        <section id="actividades" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.activities.title}</h2>
            <p className="text-terreta-dark/80 leading-relaxed mb-4">
              {t.activities.desc}
            </p>
            <ul className="list-disc list-inside text-terreta-dark/80 space-y-1">
              <li>{t.activities.friday}</li>
              <li>{t.activities.saturday}</li>
              <li>{t.activities.sunday}</li>
            </ul>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="border-t border-terreta-border">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.benefits.title}</h2>
            <ul className="grid md:grid-cols-2 gap-3 text-terreta-dark/80">
              <li className="flex items-start gap-2"><span className="text-terreta-accent mt-0.5">•</span> {t.benefits.b1}</li>
              <li className="flex items-start gap-2"><span className="text-terreta-accent mt-0.5">•</span> {t.benefits.b2}</li>
              <li className="flex items-start gap-2"><span className="text-terreta-accent mt-0.5">•</span> {t.benefits.b3}</li>
              <li className="flex items-start gap-2"><span className="text-terreta-accent mt-0.5">•</span> {t.benefits.b4}</li>
              <li className="flex items-start gap-2"><span className="text-terreta-accent mt-0.5">•</span> {t.benefits.b5}</li>
            </ul>
          </div>
        </section>

        {/* Agenda */}
        <section id="agenda" className="border-t border-terreta-border bg-terreta-card/30">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.agenda.title}</h2>
            <ul className="space-y-4">
              {[
                { day: t.agenda.dayFri, time: '18:00 – 22:00', desc: t.agenda.descFri },
                { day: t.agenda.daySat, time: '09:00 – 22:00', desc: t.agenda.descSat },
                { day: t.agenda.daySun, time: '09:00 – 21:00', desc: t.agenda.descSun },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 p-4 rounded-lg border border-terreta-border bg-terreta-bg">
                  <div className="flex-shrink-0">
                    <span className="font-bold text-terreta-accent">{item.day}</span>
                    <p className="text-sm text-terreta-dark/70">{item.time}</p>
                  </div>
                  <p className="text-terreta-dark/80">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mentores y jurado */}
        <section id="mentores" className="border-t border-terreta-border bg-terreta-card/30">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.mentors.title}</h2>
            <p className="text-terreta-dark/70 italic">{t.mentors.text}</p>
          </div>
        </section>

        {/* Consultorio de Camila */}
        <section id="consultorio-camila" className="border-t border-terreta-border">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.camila.title}</h2>
            <p className="text-terreta-dark/80 mb-4">{t.camila.intro}</p>
            <p className="text-terreta-dark/80 mb-4">
              {t.camila.membersOnly}
              <a href="https://terretahub.com" target="_blank" rel="noopener noreferrer" className="text-terreta-accent hover:underline font-medium">
                {t.camila.membersLink}
              </a>
              {t.camila.membersOnlySuffix}
            </p>
            <ul className="text-terreta-dark/80 space-y-2 list-disc list-inside">
              <li>{t.camila.duration}</li>
              <li>{t.camila.languages}</li>
              <li>{t.camila.authorize}</li>
            </ul>
          </div>
        </section>

        {/* Partners y sponsors */}
        <section id="partners" className="border-t border-terreta-border">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">{t.partners.title}</h2>
            <p className="text-terreta-dark/80 mb-4">
              {t.partners.techstars} <a href={TECHSTARS_URL} target="_blank" rel="noopener noreferrer" className="text-terreta-accent hover:underline inline-flex items-center gap-1">Techstars Startup Weekend <ExternalLink size={14} /></a>.
            </p>
            <p className="text-terreta-dark/70 text-sm">{t.partners.local}</p>
          </div>
        </section>

        {/* Countdown */}
        <section id="countdown" className="border-t border-terreta-border bg-terreta-card/30">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t.countdown.title}</h2>
            <Countdown eventDate={EVENT_DATE} labels={t.countdown} />
          </div>
        </section>

        {/* Patrocinio */}
        <section id="sponsor" className="border-t border-terreta-border bg-terreta-card/30 scroll-mt-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{t.sponsor.title}</h2>
            <p className="text-terreta-dark/80 mb-6">
              {t.sponsor.intro}
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { name: 'Bronze', price: '500', benefits: t.sponsor.benefitsBronze },
                { name: 'Silver', price: '1.200', benefits: t.sponsor.benefitsSilver },
                { name: 'Gold', price: '2.500', benefits: t.sponsor.benefitsGold },
              ].map((pkg) => (
                <div key={pkg.name} className="p-4 rounded-xl border border-terreta-border bg-terreta-bg">
                  <h3 className="font-serif text-lg font-bold text-terreta-accent mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-terreta-dark mb-3">{pkg.price}{TICKET_CURRENCY}</p>
                  <ul className="text-sm text-terreta-dark/80 space-y-1">
                    {pkg.benefits.map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRegistrationModalType('sponsor')}
              className="px-6 py-3 bg-terreta-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t.sponsor.cta}
            </button>
          </div>
        </section>

        {/* Marca y legales */}
        <section className="border-t border-terreta-border bg-terreta-card/30">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-terreta-dark/70">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
              <a href={TECHSTARS_URL} target="_blank" rel="noopener noreferrer" className="text-terreta-accent hover:underline">
                Techstars Startup Weekend
              </a>
              <span className="text-terreta-border/50 hidden sm:inline" aria-hidden>|</span>
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
