import React, { useRef, useState } from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

type EventCategory = 'polvora' | 'flores' | 'fuego' | 'musica';

interface ScheduleEvent {
  id: string;
  time: string;
  titleEs: string;
  titleEn: string;
  category: EventCategory;
  isStar?: boolean;
  locationEs?: string;
  locationEn?: string;
}

interface DaySchedule {
  month: number;
  day: number;
  dateKey: string;
  dayLabelEs: string;
  dayLabelEn: string;
  starEvent: ScheduleEvent;
  events: ScheduleEvent[];
}

const SCHEDULE_2026: DaySchedule[] = [
  {
    month: 2,
    day: 28,
    dateKey: 'day-2-28',
    dayLabelEs: 'Sábado 28 feb',
    dayLabelEn: 'Sat 28 Feb',
    starEvent: {
      id: '28-cabalgata',
      time: '17:30',
      titleEs: 'Cabalgata del Ninot',
      titleEn: 'Ninot Parade',
      category: 'musica',
      isStar: true,
      locationEs: 'Glorieta → La Paz → San Vicente → Plaza Ayuntamiento → Marqués de Sotelo → Xátiva',
      locationEn: 'Glorieta → La Paz → San Vicente → City Hall Square → Marqués de Sotelo → Xátiva',
    },
    events: [
      {
        id: '28-feria',
        time: '10:00–13:30',
        titleEs: 'Feria del coleccionismo fallero',
        titleEn: 'Fallas collectibles fair',
        category: 'musica',
        locationEs: 'Jardines de la Junta Central Fallera',
        locationEn: 'Junta Central Fallera Gardens',
      },
      {
        id: '28-cabalgata',
        time: '17:30',
        titleEs: 'Cabalgata del Ninot',
        titleEn: 'Ninot Parade',
        category: 'musica',
        isStar: true,
        locationEs: 'Glorieta → La Paz → San Vicente → Plaza Ayuntamiento → Marqués de Sotelo → Xátiva',
        locationEn: 'Glorieta → La Paz → San Vicente → City Hall Square → Marqués de Sotelo → Xátiva',
      },
      {
        id: '28-pirotecnia',
        time: '23:59',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
    ],
  },
  {
    month: 3,
    day: 1,
    dateKey: 'day-3-1',
    dayLabelEs: 'Domingo 1 mar',
    dayLabelEn: 'Sun 1 Mar',
    starEvent: {
      id: '1-mascleta',
      time: '14:00',
      titleEs: 'Mascletà',
      titleEn: 'Mascletà',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento',
      locationEn: 'City Hall Square',
    },
    events: [
      {
        id: '1-cant',
        time: '10:00',
        titleEs: "LXIV Concurso del Cant de l'Estoreta",
        titleEn: "LXIV Cant de l'Estoreta Contest",
        category: 'musica',
        locationEs: 'Falla Plaza del Árbol (JCF)',
        locationEn: 'Falla Plaza del Árbol (JCF)',
      },
      {
        id: '1-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '1-pirotecnia',
        time: '20:00',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
    ],
  },
  {
    month: 3,
    day: 2,
    dateKey: 'day-3-2',
    dayLabelEs: 'Lunes 2 mar',
    dayLabelEn: 'Mon 2 Mar',
    starEvent: {
      id: '2-mascleta',
      time: '14:00',
      titleEs: 'Mascletà',
      titleEn: 'Mascletà',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento',
      locationEn: 'City Hall Square',
    },
    events: [
      {
        id: '2-visita',
        time: '10:30',
        titleEs: 'Visita Falleras Mayores y Cortes de Honor a la Ciudad del Artista Fallero',
        titleEn: 'Falleras Mayores and Courts of Honour visit to the Fallero Artist City',
        category: 'musica',
        locationEs: 'Ciudad del Artista Fallero (talleres)',
        locationEn: 'Ciudad del Artista Fallero (workshops)',
      },
      {
        id: '2-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
    ],
  },
  {
    month: 3,
    day: 6,
    dateKey: 'day-3-6',
    dayLabelEs: 'Viernes 6 mar',
    dayLabelEn: 'Fri 6 Mar',
    starEvent: {
      id: '6-pirotecnia',
      time: '23:59',
      titleEs: 'Espectáculo pirotécnico nocturno',
      titleEn: 'Night fireworks display',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento · Pirotecnia Pibierzo',
      locationEn: 'City Hall Square · Pibierzo fireworks company',
    },
    events: [
      {
        id: '6-pirotecnia',
        time: '23:59',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Pibierzo',
        locationEn: 'City Hall Square · Pibierzo fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 7,
    dateKey: 'day-3-7',
    dayLabelEs: 'Sábado 7 mar',
    dayLabelEn: 'Sat 7 Mar',
    starEvent: {
      id: '7-pirotecnia',
      time: '23:59',
      titleEs: 'Espectáculo pirotécnico nocturno',
      titleEn: 'Night fireworks display',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento · Pirotecnia Tomás',
      locationEn: 'City Hall Square · Tomás fireworks company',
    },
    events: [
      {
        id: '7-pirotecnia',
        time: '23:59',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Tomás',
        locationEn: 'City Hall Square · Tomás fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 8,
    dateKey: 'day-3-8',
    dayLabelEs: 'Domingo 8 mar',
    dayLabelEn: 'Sun 8 Mar',
    starEvent: {
      id: '8-pirotecnia',
      time: '20:00',
      titleEs: 'Espectáculo pirotécnico nocturno',
      titleEn: 'Night fireworks display',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento · Pirotecnia Nadal Martí',
      locationEn: 'City Hall Square · Nadal Martí fireworks company',
    },
    events: [
      {
        id: '8-pirotecnia',
        time: '20:00',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Nadal Martí',
        locationEn: 'City Hall Square · Nadal Martí fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 12,
    dateKey: 'day-3-12',
    dayLabelEs: 'Jueves 12 mar',
    dayLabelEn: 'Thu 12 Mar',
    starEvent: {
      id: '12-pirotecnia',
      time: '20:30',
      titleEs: 'Espectáculo pirotécnico nocturno',
      titleEn: 'Night fireworks display',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento · Pirotecnia Alpujarreña',
      locationEn: 'City Hall Square · Alpujarreña fireworks company',
    },
    events: [
      {
        id: '12-pirotecnia',
        time: '20:30',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Alpujarreña',
        locationEn: 'City Hall Square · Alpujarreña fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 13,
    dateKey: 'day-3-13',
    dayLabelEs: 'Viernes 13 mar',
    dayLabelEn: 'Fri 13 Mar',
    starEvent: {
      id: '13-pirotecnia',
      time: '23:59',
      titleEs: 'Espectáculo pirotécnico nocturno',
      titleEn: 'Night fireworks display',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento · Pirotecnia Turís',
      locationEn: 'City Hall Square · Turís fireworks company',
    },
    events: [
      {
        id: '13-pirotecnia',
        time: '23:59',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Turís',
        locationEn: 'City Hall Square · Turís fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 14,
    dateKey: 'day-3-14',
    dayLabelEs: 'Sábado 14 mar',
    dayLabelEn: 'Sat 14 Mar',
    starEvent: {
      id: '14-mascleta',
      time: '14:00',
      titleEs: 'Mascletà',
      titleEn: 'Mascletà',
      category: 'polvora',
      isStar: true,
      locationEs: 'Plaza del Ayuntamiento',
      locationEn: 'City Hall Square',
    },
    events: [
      {
        id: '14-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        isStar: true,
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '14-castillos',
        time: '00:00',
        titleEs: 'Castillos de fuegos (barrios)',
        titleEn: 'Firework castles (neighborhoods)',
        category: 'polvora',
      },
      {
        id: '14-pirotecnia',
        time: '23:59',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento · Pirotecnia Tamarit',
        locationEn: 'City Hall Square · Tamarit fireworks company',
      },
    ],
  },
  {
    month: 3,
    day: 15,
    dateKey: 'day-3-15',
    dayLabelEs: 'Domingo 15 mar',
    dayLabelEn: 'Sun 15 Mar',
    starEvent: {
      id: '15-plantà',
      time: '08:00',
      titleEs: 'Plantà (monumentos en la calle)',
      titleEn: 'Plantà (monuments in the street)',
      category: 'fuego',
      isStar: true,
    },
    events: [
      {
        id: '15-plantà',
        time: '08:00',
        titleEs: 'Plantà',
        titleEn: 'Plantà',
        category: 'fuego',
        isStar: true,
      },
      {
        id: '15-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '15-ofrenda',
        time: '16:00',
        titleEs: 'Inicio Ofrenda de flores',
        titleEn: 'Flower offering begins',
        category: 'flores',
        locationEs: 'Plaza de la Virgen',
        locationEn: 'Plaza de la Virgen',
      },
    ],
  },
  {
    month: 3,
    day: 16,
    dateKey: 'day-3-16',
    dayLabelEs: 'Lunes 16 mar',
    dayLabelEn: 'Mon 16 Mar',
    starEvent: {
      id: '16-ofrenda',
      time: '16:00',
      titleEs: 'Ofrenda de flores',
      titleEn: 'Flower offering',
      category: 'flores',
      isStar: true,
      locationEs: 'Plaza de la Virgen',
      locationEn: 'Plaza de la Virgen',
    },
    events: [
      {
        id: '16-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '16-ofrenda',
        time: '16:00',
        titleEs: 'Ofrenda de flores',
        titleEn: 'Flower offering',
        category: 'flores',
        isStar: true,
        locationEs: 'Plaza de la Virgen',
        locationEn: 'Plaza de la Virgen',
      },
      {
        id: '16-verbena',
        time: '22:00',
        titleEs: 'Verbenas en los barrios',
        titleEn: 'Street parties in neighborhoods',
        category: 'musica',
      },
    ],
  },
  {
    month: 3,
    day: 17,
    dateKey: 'day-3-17',
    dayLabelEs: 'Martes 17 mar',
    dayLabelEn: 'Tue 17 Mar',
    starEvent: {
      id: '17-ofrenda',
      time: '16:00',
      titleEs: 'Ofrenda de flores',
      titleEn: 'Flower offering',
      category: 'flores',
      isStar: true,
      locationEs: 'Plaza de la Virgen',
      locationEn: 'Plaza de la Virgen',
    },
    events: [
      {
        id: '17-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '17-ofrenda',
        time: '16:00',
        titleEs: 'Ofrenda de flores',
        titleEn: 'Flower offering',
        category: 'flores',
        isStar: true,
        locationEs: 'Plaza de la Virgen',
        locationEn: 'Plaza de la Virgen',
      },
    ],
  },
  {
    month: 3,
    day: 18,
    dateKey: 'day-3-18',
    dayLabelEs: 'Miércoles 18 mar',
    dayLabelEn: 'Wed 18 Mar',
    starEvent: {
      id: '18-nit-foc',
      time: '01:30',
      titleEs: 'Nit del Foc',
      titleEn: 'Night of Fire',
      category: 'polvora',
      isStar: true,
      locationEs: 'Paseo de la Alameda',
      locationEn: 'Paseo de la Alameda',
    },
    events: [
      {
        id: '18-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '18-nit-foc',
        time: '01:30',
        titleEs: 'Nit del Foc',
        titleEn: 'Night of Fire',
        category: 'polvora',
        isStar: true,
        locationEs: 'Paseo de la Alameda',
        locationEn: 'Paseo de la Alameda',
      },
    ],
  },
  {
    month: 3,
    day: 19,
    dateKey: 'day-3-19',
    dayLabelEs: 'Jueves 19 mar',
    dayLabelEn: 'Thu 19 Mar',
    starEvent: {
      id: '19-crema-todas',
      time: '00:00',
      titleEs: 'La Cremà (todas las fallas)',
      titleEn: 'The Cremà (all fallas)',
      category: 'fuego',
      isStar: true,
      locationEs: 'Todas las fallas de València',
      locationEn: 'All fallas in València',
    },
    events: [
      {
        id: '19-ofrenda-patriarca',
        time: '11:00',
        titleEs:
          'Ofrenda de flores de las Falleras Mayores de València y sus Cortes de Honor ante la imagen del Patriarca',
        titleEn:
          'Flower offering by the Falleras Mayores of València and their Courts of Honour before the image of the Patriarch',
        category: 'flores',
        locationEs: 'Puente de San José',
        locationEn: 'San José bridge',
      },
      {
        id: '19-misa-patriarca',
        time: '12:00',
        titleEs:
          'Misa solemne en honor al Patriarca San José, ofrecida por Junta Central Fallera y el Gremio de Carpinteros',
        titleEn:
          'Solemn mass in honour of Saint Joseph, offered by Junta Central Fallera and the Carpenters’ Guild',
        category: 'musica',
        locationEs: 'Catedral de València',
        locationEn: 'València Cathedral',
      },
      {
        id: '19-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '19-cabalgata-foc',
        time: '19:00',
        titleEs: 'Cabalgata del Fuego',
        titleEn: 'Fire Parade',
        category: 'fuego',
        locationEs: 'Calle Colón · de Ruzafa a Puerta del Mar',
        locationEn: 'Colón street · from Ruzafa to Puerta del Mar',
      },
      {
        id: '19-crema-infantiles',
        time: '22:00',
        titleEs: 'Cremà de las fallas infantiles',
        titleEn: 'Cremà of children’s fallas',
        category: 'fuego',
      },
      {
        id: '19-crema-infantil-especial',
        time: '22:30',
        titleEs: 'Cremà de la falla infantil, primer premio de Sección Especial',
        titleEn: 'Cremà of the winning children’s falla in Special Section',
        category: 'fuego',
      },
      {
        id: '19-crema-infantil-ayto',
        time: '23:00',
        titleEs: 'Cremà de la falla infantil de la Plaza del Ayuntamiento',
        titleEn: 'Cremà of the children’s falla in City Hall Square',
        category: 'fuego',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '19-crema-todas',
        time: '00:00',
        titleEs: 'Cremà de todas las fallas de València',
        titleEn: 'Cremà of all fallas in València',
        category: 'fuego',
        isStar: true,
      },
      {
        id: '19-crema-especial',
        time: '00:30',
        titleEs: 'Cremà de la falla, primer premio de Sección Especial',
        titleEn: 'Cremà of the winning falla in Special Section',
        category: 'fuego',
      },
      {
        id: '19-crema-ayto',
        time: '01:00',
        titleEs: 'Cremà de la falla de la Plaza del Ayuntamiento',
        titleEn: 'Cremà of the City Hall Square falla',
        category: 'fuego',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
    ],
  },
];

export const FallasSchedulePage: React.FC = () => {
  const { language } = useFallasLanguage();
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingFromClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleDateClick = (dateKey: string) => {
    const el = dayRefs.current[dateKey];
    if (!el) return;
    isScrollingFromClick.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isScrollingFromClick.current = false;
    }, 800);
  };

  const t = (es: string, en: string) => (language === 'es' ? es : en);
  const handleStep = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    const nextIndex = Math.min(
      Math.max(activeIndex + offset, 0),
      SCHEDULE_2026.length - 1
    );
    if (nextIndex === activeIndex) return;
    const targetDay = SCHEDULE_2026[nextIndex];
    setActiveIndex(nextIndex);
    handleDateClick(targetDay.dateKey);
  };

  const activeDay = SCHEDULE_2026[activeIndex];

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Fechas y programa 2026', 'Dates & Schedule 2026')}
        </h2>
        <div className="flex items-center gap-2 text-sm text-terreta-secondary">
          <button
            type="button"
            onClick={() => handleStep('prev')}
            disabled={activeIndex === 0}
            className="px-2 py-1 rounded-full border border-terreta-border text-terreta-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terreta-bg transition-colors"
            aria-label={t('Ir al día anterior', 'Go to previous day')}
          >
            ‹
          </button>
          <span className="font-semibold text-terreta-dark">
            {language === 'es' ? activeDay.dayLabelEs : activeDay.dayLabelEn}
          </span>
          <button
            type="button"
            onClick={() => handleStep('next')}
            disabled={activeIndex === SCHEDULE_2026.length - 1}
            className="px-2 py-1 rounded-full border border-terreta-border text-terreta-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terreta-bg transition-colors"
            aria-label={t('Ir al día siguiente', 'Go to next day')}
          >
            ›
          </button>
        </div>
      </header>

      {/* Vertical timeline */}
      <div className="relative space-y-8">
        {SCHEDULE_2026.map((daySchedule, index) => {
          return (
            <div
              key={daySchedule.dateKey}
              ref={(el) => {
                dayRefs.current[daySchedule.dateKey] = el;
              }}
              id={daySchedule.dateKey}
              className="relative scroll-mt-32"
            >
              {/* Timeline line (left vertical bar) */}
              {index < SCHEDULE_2026.length - 1 && (
                <div
                  className="absolute left-[15px] top-14 bottom-0 w-0.5 bg-terreta-border hidden sm:block"
                  aria-hidden
                />
              )}

              {/* Day card */}
              <article className="relative flex gap-4 sm:gap-6">
                {/* Bubble (day number) */}
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-terreta-accent text-white flex items-center justify-center shadow-md border-2 border-white ring-2 ring-terreta-accent/30">
                  <span className="font-sans font-black text-xl sm:text-2xl tabular-nums">
                    {daySchedule.day}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pb-2">
                  <div className="bg-white rounded-2xl border border-terreta-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Star event strip */}
                    <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-terreta-border/70 bg-terreta-bg/50 flex flex-wrap items-center gap-2">
                      <span className="font-sans font-bold text-terreta-dark text-sm sm:text-base">
                        {language === 'es'
                          ? daySchedule.starEvent.titleEs
                          : daySchedule.starEvent.titleEn}
                      </span>
                    </div>

                    {/* Event list */}
                    <ul className="divide-y divide-terreta-border/70">
                      {daySchedule.events.map((event) => {
                        return (
                          <li
                            key={event.id}
                            className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center gap-2"
                          >
                            <span className="font-mono text-sm font-semibold text-terreta-secondary tabular-nums w-12 shrink-0">
                              {event.time}
                            </span>
                            <span className="font-sans font-medium text-terreta-dark text-sm sm:text-base">
                              {language === 'es'
                                ? event.titleEs
                                : event.titleEn}
                            </span>
                            {(event.locationEs ?? event.locationEn) && (
                              <span className="w-full text-xs text-terreta-secondary pl-14 sm:pl-16">
                                {language === 'es'
                                  ? event.locationEs
                                  : event.locationEn}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
};
