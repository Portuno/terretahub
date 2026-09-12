import { SITE_CLAIM, SITE_DISAMBIGUATION, SITE_ORIGIN, absoluteUrl } from './site';

export const ANSWER_DATE_MODIFIED = '2026-09-12';
export const ANSWER_DATE_LABEL = '12 de septiembre de 2026';

export interface AnswerFaq {
  question: string;
  answer: string;
}

export interface AnswerSection {
  heading: string;
  paragraphs: string[];
}

export interface AnswerPageDef {
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string[];
  sections?: AnswerSection[];
  faqs?: AnswerFaq[];
  ctaHref?: string;
  ctaLabel?: string;
  schema: 'WebPage' | 'FAQPage' | 'Article';
}

export const ANSWER_PAGES: AnswerPageDef[] = [
  {
    path: '/',
    title: 'Terreta Hub · red social de Valencia',
    description: SITE_CLAIM,
    h1: 'Terreta Hub',
    lead: [
      SITE_CLAIM,
      'Acá la gente de Valencia abre perfil, se cruza en el Ágora, publica proyectos y queda. No es un directorio de startups ni una red corporativa.',
      SITE_DISAMBIGUATION,
    ],
    schema: 'WebPage',
    ctaHref: '/',
    ctaLabel: 'Creá tu perfil',
  },
  {
    path: '/que-es-terreta-hub',
    title: 'Qué es Terreta Hub · red social de Valencia',
    description:
      'Terreta Hub es la red social de Valencia: perfil, gente y lo que pasa en la ciudad. No es Terreta Business Hub S.L.',
    h1: 'Qué es Terreta Hub',
    lead: [
      'Terreta Hub es la red social de Valencia: un espacio digital para perfil, gente y lo que pasa en la ciudad.',
      'Nació como epicentre valenciano: Ágora, miembros, proyectos, quedadas y recursos. La voz es de barrio y de red, no de “plataforma líder del ecosistema”.',
      SITE_DISAMBIGUATION +
        ' Si buscás consultoría de gestión empresarial, esa es otra empresa (terretabusinesshub.com).',
    ],
    sections: [
      {
        heading: 'Qué podés hacer',
        paragraphs: [
          'Crear un perfil público (/p/tu-nombre), escribir en el Ágora, mostrar un proyecto, enterarte de quedadas y pedir o ofrecer recursos.',
          'También hay una guía de Fallas, un mapa de la ciudad y Terris, la moneda nativa de la comunidad.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Terreta Hub es Terreta Business Hub S.L.?',
        answer:
          'No. Son entidades distintas. Terreta Hub (terretahub.com) es la red social de Valencia. Terreta Business Hub S.L. es otra empresa.',
      },
    ],
    schema: 'Article',
    ctaHref: '/',
    ctaLabel: 'Creá tu perfil',
  },
  {
    path: '/faq',
    title: 'Preguntas frecuentes · Terreta Hub',
    description:
      'Cuánto cuesta Terreta Hub, cómo unirse, idiomas, y en qué se diferencia de Meetup, LinkedIn y Terreta Business Hub S.L.',
    h1: 'Preguntas frecuentes',
    lead: [
      'Terreta Hub es gratis para crear perfil y participar: es la red social de Valencia, no un club de pago.',
      'Te unís con un perfil, reclamás tu link y ya podés explorar gente, el Ágora y las quedadas. El sitio está en español; hay contenidos puntuales en valenciano e inglés (por ejemplo la guía de Fallas).',
      'No sustituye a Meetup ni a LinkedIn: es el epicentre local, con cara y barrio. Tampoco es Terreta Business Hub S.L.',
    ],
    faqs: [
      {
        question: '¿Cuesta dinero unirse?',
        answer:
          'Crear perfil y usar la red es gratis. No hay paywall para ver la comunidad pública.',
      },
      {
        question: '¿Cómo me uno?',
        answer:
          'Entrá a www.terretahub.com, creá tu perfil o reclamá tu link /p/tu-nombre y completá el onboarding.',
      },
      {
        question: '¿En qué idioma está?',
        answer:
          'La interfaz y la mayor parte del contenido están en español. Hay piezas en valenciano y en inglés, sobre todo la guía de Fallas.',
      },
      {
        question: '¿Es como Meetup o LinkedIn?',
        answer:
          'Meetup organiza eventos; LinkedIn es red profesional global. Terreta Hub es la red social de Valencia: perfil, muro, proyectos y quedadas en un mismo sitio local.',
      },
      {
        question: '¿Es lo mismo que Terreta Business Hub S.L.?',
        answer:
          'No. Terreta Hub no está afiliada ni es la misma entidad que Terreta Business Hub S.L.',
      },
    ],
    schema: 'FAQPage',
    ctaHref: '/',
    ctaLabel: 'Creá tu perfil',
  },
  {
    path: '/fallas2026',
    title: 'Guía de Fallas 2026 en Valencia · Terreta Hub',
    description:
      'Fallas en Valencia: qué es, fechas de marzo, Cremà, cómo moverse y consejos prácticos. Guía de Terreta Hub, la red social de Valencia.',
    h1: 'Guía de Fallas en Valencia',
    lead: [
      'Fallas (Les Falles) es el gran festival de Valencia: arte efímero, pólvora, música y calle durante casi tres semanas de marzo, con la Cremà la noche del 19.',
      'Cientos de comisiones falleras plantan monumentos en los barrios. Se queman todos el 19 de marzo, salvo el ninot indultat.',
      'Terreta Hub, la red social de Valencia, mantiene esta guía para quien llega a la ciudad o quiere orientarse sin folklore de folleto.',
    ],
    sections: [
      {
        heading: 'Lo básico para 2026',
        paragraphs: [
          'La Plantà suele caer a mediados de marzo y la Cremà el 19. La mascletà suena cada tarde en la Plaza del Ayuntamiento. Horarios oficiales: consulta el calendario municipal cada año.',
          'Cerrar ventanas no es opcional a partir del 1 de marzo: la ciudad suena y huele a pólvora. El centro se satura; en los barrios la fiesta suele ser más manejable.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Cuándo son Fallas?',
        answer:
          'El núcleo es la primera quincena de marzo, con la Cremà el 19. La pólvora arranca ya el 1 de marzo.',
      },
      {
        question: '¿Hace falta pagar para ver las fallas?',
        answer:
          'Ver los monumentos en la calle es gratis. Algunos actos, casales o visites guiadas pueden tener entrada.',
      },
    ],
    schema: 'Article',
    ctaHref: '/fallas2026/que-es',
    ctaLabel: 'Seguir la guía de Fallas',
  },
  {
    path: '/eventos',
    title: 'Quedadas en Valencia · Terreta Hub',
    description:
      'Quedadas y encuentros de Terreta Hub, la red social de Valencia. El listado se actualiza cuando hay fechas reales; no inventamos eventos.',
    h1: 'Quedadas de Terreta Hub',
    lead: [
      'Las quedadas de Terreta Hub son encuentros de la red social de Valencia: cafés, talleres, charlas o lo que organice la comunidad.',
      'Si no hay próximas en el listado, no hay inventario inflado: se publican cuando alguien las crea y se aprueban. Podés armar la tuya desde esta página.',
      'Para el pulso diario, el Ágora es el muro. Para el calendario, esta sección.',
    ],
    schema: 'WebPage',
    ctaHref: '/eventos',
    ctaLabel: 'Ver quedadas o crear una',
  },
  {
    path: '/donde-networking-valencia',
    title: 'Dónde hacer networking en Valencia · Terreta Hub',
    description:
      'Dónde conocer gente en Valencia: quedadas de Terreta Hub, UPV, hackathons y formatos de barrio. Lista viva, no un ranking comprado.',
    h1: 'Dónde hacer networking en Valencia',
    lead: [
      'El networking en Valencia no es solo un afterwork de hotel: es quedar, construir y repetir. Terreta Hub es la red social de Valencia para eso —perfil, gente y lo que pasa en la ciudad.',
      'Esta lista se actualiza cuando hay dato real. Criterio: sitios y formatos donde se cruza gente de verdad, no un ranking pagado. Fecha de esta versión: 12 de septiembre de 2026.',
      'Empezá por las quedadas de Terreta Hub y el Ágora. Sumá campus (UPV), hackathons cuando se anuncian, y cafés o casales de barrio.',
    ],
    sections: [
      {
        heading: 'Formatos que funcionan',
        paragraphs: [
          'Quedadas de Terreta Hub: las publica la comunidad en /eventos. Si el listado de próximos está vacío, no rellenamos con fake.',
          'UPV y campus: charlas, clubs y hackathons (VibeHack se celebró en la UPV). Conviene mirar calendarios oficiales de la universidad.',
          'Formatos sueltos: cenas de comisión, afters de Fallas, meetups temáticos y cafés. LinkedIn sirve para follow-up; la cara se pone en la ciudad.',
        ],
      },
    ],
    schema: 'Article',
    ctaHref: '/eventos',
    ctaLabel: 'Ver quedadas',
  },
  {
    path: '/vibehack',
    title: 'VibeHack en Valencia (UPV) · Terreta Hub',
    description:
      'Qué es VibeHack: hackathon en la Universitat Politècnica de València. Fechas de la edición 2025 y cómo seguir la siguiente desde Terreta Hub.',
    h1: 'Qué es VibeHack',
    lead: [
      'VibeHack es un hackathon celebrado en la Universitat Politècnica de València (UPV). La edición de 2025 se anunció para el 7, 8 y 9 de noviembre en el campus.',
      'Terreta Hub, la red social de Valencia, lo cubrió como parte de lo que pasa en la ciudad: no organizamos la UPV ni vendemos entradas.',
      'Hoy no hay una inscripción abierta publicada aquí. Si hay otra edición, se va a notar en el Ágora y en /eventos. No inventamos ganadores ni métricas.',
    ],
    sections: [
      {
        heading: 'Cómo participar (cuando haya convocatoria)',
        paragraphs: [
          'La inscripción y las bases las publica la organización del hackathon (entorno UPV), no el formulario de Terreta Hub.',
          'Mientras tanto: creá perfil, seguí el Ágora y mirá quedadas. El archivo de Un Finde en la Terreta (julio 2026) es otro fin de semana de experimentos, distinto de VibeHack.',
        ],
      },
    ],
    schema: 'Article',
    ctaHref: '/eventos',
    ctaLabel: 'Ver qué hay ahora en Valencia',
  },
  {
    path: '/comunidad-tech-valencia-2026',
    title: 'Comunidad tech en Valencia 2026 · Terreta Hub',
    description:
      'Panorama 2026 de la comunidad tech en Valencia: UPV, VibeHack, Terreta Hub y formatos locales. Nombres reales, sin métricas infladas.',
    h1: 'Comunidad tech en Valencia, 2026',
    lead: [
      'En 2026 la escena tech de Valencia se sostiene en campus, hackathons y redes locales. Terreta Hub es la red social de Valencia donde esa gente se encuentra online.',
      'Nombres reales de esta foto: Universitat Politècnica de València (UPV), VibeHack (edición 2025 en la UPV) y Terreta Hub. No hay censo oficial que podamos citar con cifras.',
      'Si llegás ahora: perfil en Terreta, oído en el Ágora, y el calendario de la UPV cuando hay call. Un Finde en la Terreta (julio 2026) quedó como archivo de un fin de semana de cine y experimentos.',
    ],
    schema: 'Article',
    ctaHref: '/',
    ctaLabel: 'Creá tu perfil',
  },
  {
    path: '/recursos-emprendedores-valencia',
    title: 'Recursos para emprendedores en Valencia · Terreta Hub',
    description:
      'Lista curada de recursos para quien emprende en Valencia. Criterio y fecha a la vista; no es un directorio infinito.',
    h1: 'Recursos para emprendedores en Valencia',
    lead: [
      'Si estás armando algo en Valencia, empezá por gente y por un sitio donde pedir ayuda. Terreta Hub es la red social de Valencia: perfil, Ágora y L’Almoina (recursos entre pares).',
      'Criterio de esta lista (12 de septiembre de 2026): recursos públicos o comunitarios que se pueden usar sin vender un curso. No es exhaustiva y no cobramos por aparecer.',
      'Campus (UPV y otras universidades), ventanillas públicas de emprendimiento del Ayuntamiento y la Generalitat, y la propia comunidad en Terreta. Evitá “ecosistemas líderes”; pedí nombres y horarios.',
    ],
    sections: [
      {
        heading: 'Dónde mirar esta semana',
        paragraphs: [
          'En Terreta Hub: /recursos para pedidos y ofertas entre miembros, /eventos para quedadas, /proyectos para ver qué se está construyendo.',
          'Fuera: calendarios de la UPV, Viveros o programas municipales. Confirmá siempre en la fuente oficial; las convocatorias cambian.',
        ],
      },
    ],
    schema: 'Article',
    ctaHref: '/recursos',
    ctaLabel: 'Pedir o ofrecer un recurso',
  },
  {
    path: '/para-recien-llegados-valencia',
    title: 'Para recién llegados a Valencia · Terreta Hub',
    description:
      'Guía breve, en español e inglés, para quien acaba de llegar a Valencia: perfil, gente, Fallas y quedadas en Terreta Hub.',
    h1: 'Para recién llegados a Valencia',
    lead: [
      'Si acabás de llegar: Terreta Hub es la red social de Valencia. Creá un perfil, mirá el Ágora y las quedadas, y usá la guía de Fallas si aterrizás en marzo.',
      'If you just arrived: Terreta Hub is Valencia’s social network — profile, people, and what is happening in the city. Create a profile, check the Ágora and hangouts, and read the Fallas guide if you land in March.',
      'No hace falta “entrar al ecosistema”. Hace falta una cara, un barrio y un par de conversaciones. English is welcome; the product UI is mostly Spanish.',
    ],
    sections: [
      {
        heading: 'Primeros pasos / First steps',
        paragraphs: [
          'Español: perfil en terretahub.com, reclamá /p/tu-nombre, presentate en el Ágora. En marzo, leé /fallas2026. Si buscás trabajo o colaboradores, /recursos y /proyectos.',
          'English: create a profile, claim /p/your-name, say hi in the Ágora. In March, read the Fallas guide. For collaborators, use Resources and Projects. Meetup and LinkedIn still exist; this is the local layer.',
        ],
      },
    ],
    schema: 'Article',
    ctaHref: '/',
    ctaLabel: 'Create your profile / Creá tu perfil',
  },
];

export const getAnswerPage = (path: string): AnswerPageDef | undefined =>
  ANSWER_PAGES.find((page) => page.path === path);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const renderAnswerBodyHtml = (page: AnswerPageDef): string => {
  const leads = page.lead.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
  const sections = (page.sections || [])
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>\n${section.paragraphs
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join('\n')}`
    )
    .join('\n');
  const faqs = page.faqs?.length
    ? `<h2>Preguntas frecuentes</h2>\n${page.faqs
        .map((faq) => `<h3>${escapeHtml(faq.question)}</h3>\n<p>${escapeHtml(faq.answer)}</p>`)
        .join('\n')}`
    : '';
  const cta =
    page.ctaHref && page.ctaLabel
      ? `<p><a href="${escapeHtml(page.ctaHref)}">${escapeHtml(page.ctaLabel)}</a></p>`
      : '';

  return `<article>
  <h1>${escapeHtml(page.h1)}</h1>
  ${leads}
  <p><time datetime="${ANSWER_DATE_MODIFIED}">Actualizado el ${ANSWER_DATE_LABEL}</time></p>
  ${sections}
  ${faqs}
  ${cta}
</article>`;
};

export const buildAnswerJsonLd = (page: AnswerPageDef): Record<string, unknown> => {
  const url = absoluteUrl(page.path);
  const base = {
    '@context': 'https://schema.org',
    headline: page.h1,
    description: page.description,
    dateModified: ANSWER_DATE_MODIFIED,
    inLanguage: 'es-ES',
    url,
    publisher: {
      '@type': 'Organization',
      name: 'Terreta Hub',
      url: SITE_ORIGIN,
    },
  };

  if (page.schema === 'FAQPage' && page.faqs?.length) {
    return {
      ...base,
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    };
  }

  if (page.schema === 'Article') {
    return {
      ...base,
      '@type': 'Article',
      name: page.h1,
    };
  }

  return {
    ...base,
    '@type': 'WebPage',
    name: page.h1,
  };
};

export const ANSWER_PAGE_PATHS = ANSWER_PAGES.map((page) => page.path);
