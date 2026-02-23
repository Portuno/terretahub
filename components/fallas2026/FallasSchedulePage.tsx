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

export const SCHEDULE_2026: DaySchedule[] = [
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
        id: '28-visita-bomberos-infantil',
        time: '10:30',
        titleEs: 'Visita de la Fallera Mayor Infantil y su Corte de Honor al Parque de Bomberos',
        titleEn: 'Fallera Mayor Infantil and Court of Honour visit to the Fire Station',
        category: 'musica',
        locationEs: 'Avenida de la Plata',
        locationEn: 'Avenida de la Plata',
      },
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
    day: 3,
    dateKey: 'day-3-3',
    dayLabelEs: 'Martes 3 mar',
    dayLabelEn: 'Tue 3 Mar',
    starEvent: {
      id: '3-mascleta',
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
        id: '3-mascleta',
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
    day: 4,
    dateKey: 'day-3-4',
    dayLabelEs: 'Miércoles 4 mar',
    dayLabelEn: 'Wed 4 Mar',
    starEvent: {
      id: '4-visita-policia',
      time: '11:00',
      titleEs: 'Visita de las Falleras Mayores y Cortes de Honor a la Central de la Policía Local',
      titleEn: 'Falleras Mayores and Courts of Honour visit to the Local Police HQ',
      category: 'musica',
      locationEs: 'València',
      locationEn: 'València',
    },
    events: [
      {
        id: '4-visita-policia',
        time: '11:00',
        titleEs: 'Visita de las Falleras Mayores de Valencia y sus Cortes de Honor a la Central de la Policía Local',
        titleEn: 'Falleras Mayores of Valencia and Courts of Honour visit to the Local Police HQ',
        category: 'musica',
        locationEs: 'València',
        locationEn: 'València',
      },
      {
        id: '4-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
    ],
  },
  {
    month: 3,
    day: 5,
    dateKey: 'day-3-5',
    dayLabelEs: 'Jueves 5 mar',
    dayLabelEn: 'Thu 5 Mar',
    starEvent: {
      id: '5-homenaje-ffaa',
      time: '18:30',
      titleEs: 'Homenaje de las Fuerzas Armadas a las FFMMV i CCHH',
      titleEn: 'Armed Forces tribute to the Falleras Mayores and Courts of Honour',
      category: 'musica',
    },
    events: [
      {
        id: '5-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '5-homenaje-ffaa',
        time: '18:30',
        titleEs: 'Homenaje de las Fuerzas Armadas a las FFMMV i CCHH',
        titleEn: 'Armed Forces tribute to the Falleras Mayores and Courts of Honour',
        category: 'musica',
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
        id: '6-ronda-antigor',
        time: '12:00',
        titleEs: '55ª Ronda Fallera de coches de l’Antigor',
        titleEn: '55th Fallera Antigor car parade',
        category: 'musica',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '6-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
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
        id: '7-visita-bomberos-fmv',
        time: '10:00',
        titleEs: 'Visita de la Fallera Mayor y su Corte de Honor al Parque de Bomberos (festividad del patrón)',
        titleEn: 'Fallera Mayor and Court of Honour visit to the Fire Station (patron saint day)',
        category: 'musica',
        locationEs: 'Avenida de la Plata',
        locationEn: 'Avenida de la Plata',
      },
      {
        id: '7-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '7-pirotecnia-20',
        time: '20:00',
        titleEs: 'Espectáculo pirotécnico nocturno',
        titleEn: 'Night fireworks display',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
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
        id: '8-homenaje-segrelles',
        time: '11:30',
        titleEs: 'Homenaje al Pintor Segrelles',
        titleEn: 'Tribute to painter Segrelles',
        category: 'musica',
        locationEs: 'Comisión Plaza del Pintor Segrelles',
        locationEn: 'Plaza del Pintor Segrelles commission',
      },
      {
        id: '8-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
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
      {
        id: '8-pirotecnia-2359',
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
    day: 9,
    dateKey: 'day-3-9',
    dayLabelEs: 'Lunes 9 mar',
    dayLabelEn: 'Mon 9 Mar',
    starEvent: {
      id: '9-mascleta',
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
        id: '9-mascleta',
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
    day: 10,
    dateKey: 'day-3-10',
    dayLabelEs: 'Martes 10 mar',
    dayLabelEn: 'Tue 10 Mar',
    starEvent: {
      id: '10-mascleta',
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
        id: '10-mascleta',
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
    day: 11,
    dateKey: 'day-3-11',
    dayLabelEs: 'Miércoles 11 mar',
    dayLabelEn: 'Wed 11 Mar',
    starEvent: {
      id: '11-mascleta',
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
        id: '11-mascleta',
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
        id: '12-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
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
        id: '13-mascleta',
        time: '14:00',
        titleEs: 'Mascletà',
        titleEn: 'Mascletà',
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
      },
      {
        id: '13-muestra-folklore',
        time: '20:00',
        titleEs: 'Muestra de bailes y canciones populares',
        titleEn: 'Traditional dance and music show',
        category: 'musica',
        locationEs: 'Plaza del Ayuntamiento · Federación de Folklore de la Comunitat Valenciana',
        locationEn: 'City Hall Square · Valencian Community Folklore Federation',
      },
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
        id: '14-clausura-ninot-infantil',
        time: '17:00',
        titleEs: 'Clausura de la Exposición del Ninot Infantil',
        titleEn: 'Closing of the Children’s Ninot Exhibition',
        category: 'musica',
      },
      {
        id: '14-ninot-indultat-infantil',
        time: '17:30',
        titleEs: 'Proclamación del Ninot Indultat Infantil 2026',
        titleEn: 'Proclamation of the 2026 Children’s Ninot Indultat',
        category: 'musica',
      },
      {
        id: '14-recogida-ninots',
        time: '17:45',
        titleEs: 'Recogida de los ninots por las comisiones (hasta 20:00 h)',
        titleEn: 'Collection of ninots by commissions (until 20:00)',
        category: 'musica',
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
        id: '15-plantà-infantiles',
        time: '09:00',
        titleEs: 'Plantà de todas las fallas infantiles',
        titleEn: 'Plantà of all children’s fallas',
        category: 'fuego',
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
      {
        id: '15-clausura-ninot',
        time: '17:00',
        titleEs: 'Clausura de la Exposición del Ninot',
        titleEn: 'Closing of the Ninot Exhibition',
        category: 'musica',
      },
      {
        id: '15-ninot-indultat',
        time: '17:30',
        titleEs: 'Lectura del veredicto popular y proclamación del Ninot Indultat 2026',
        titleEn: 'Popular vote result and proclamation of the 2026 Ninot Indultat',
        category: 'musica',
      },
      {
        id: '15-recogida-ninots',
        time: '17:45',
        titleEs: 'Recogida de los ninots por las comisiones (hasta 20:00 h)',
        titleEn: 'Collection of ninots by commissions (until 20:00)',
        category: 'musica',
      },
      {
        id: '15-alba',
        time: '23:59',
        titleEs: "L'Alba de las Fallas (espectáculo pirotécnico)",
        titleEn: "L'Alba de les Falles (fireworks display)",
        category: 'polvora',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
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
        id: '16-plantà',
        time: '08:00',
        titleEs: 'Plantà de todas las fallas',
        titleEn: 'Plantà of all fallas',
        category: 'fuego',
      },
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
        id: '16-entrega-premios-infantiles',
        time: '16:30',
        titleEs: 'Entrega de Premios Infantiles',
        titleEn: 'Children’s awards ceremony',
        category: 'musica',
        locationEs: 'Tribuna en el Ayuntamiento',
        locationEn: 'City Hall stand',
      },
      {
        id: '16-verbena',
        time: '22:00',
        titleEs: 'Verbenas en los barrios',
        titleEn: 'Street parties in neighborhoods',
        category: 'musica',
      },
      {
        id: '16-castillo',
        time: '23:59',
        titleEs: 'Castillo de Fuegos Artificiales',
        titleEn: 'Firework castle',
        category: 'polvora',
        locationEs: 'Puente de Monteolivete',
        locationEn: 'Monteolivete bridge',
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
        id: '17-entrega-premios',
        time: '09:00',
        titleEs: 'Entrega de Premios',
        titleEn: 'Awards ceremony',
        category: 'musica',
        locationEs: 'Tribuna en el Ayuntamiento',
        locationEn: 'City Hall stand',
      },
      {
        id: '17-homenaje-thous',
        time: '10:00',
        titleEs: 'Homenaje al poeta Maximiliano Thous',
        titleEn: 'Tribute to poet Maximiliano Thous',
        category: 'musica',
        locationEs: 'Cruce Sagunto / Maximiliano Thous',
        locationEn: 'Sagunto / Maximiliano Thous',
      },
      {
        id: '17-homenaje-serrano',
        time: '12:00',
        titleEs: 'Homenaje al Maestro Serrano',
        titleEn: 'Tribute to Maestro Serrano',
        category: 'musica',
        locationEs: 'Avenida del Reino de Valencia',
        locationEn: 'Avenida del Reino de Valencia',
      },
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
        time: '15:30',
        titleEs: 'Ofrenda de flores a la Mare de Déu',
        titleEn: 'Flower offering to the Mare de Déu',
        category: 'flores',
        isStar: true,
        locationEs: 'Plaza de la Virgen',
        locationEn: 'Plaza de la Virgen',
      },
      {
        id: '17-castillo',
        time: '23:59',
        titleEs: 'Castillo de Fuegos Artificiales',
        titleEn: 'Firework castle',
        category: 'polvora',
        locationEs: 'Puente de Monteolivete',
        locationEn: 'Monteolivete bridge',
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
        id: '18-ofrenda',
        time: '15:30',
        titleEs: 'Ofrenda de flores a la Mare de Déu',
        titleEn: 'Flower offering to the Mare de Déu',
        category: 'flores',
        locationEs: 'Plaza de la Virgen',
        locationEn: 'Plaza de la Virgen',
      },
      {
        id: '18-nit-foc',
        time: '23:59',
        titleEs: 'Nit del Foc. Castillo de Fuegos Artificiales',
        titleEn: 'Night of Fire. Firework castle',
        category: 'polvora',
        isStar: true,
        locationEs: 'Puente de Monteolivete',
        locationEn: 'Monteolivete bridge',
      },
      {
        id: '18-nit-foc-alameda',
        time: '01:30',
        titleEs: 'Nit del Foc (Paseo de la Alameda)',
        titleEn: 'Night of Fire (Paseo de la Alameda)',
        category: 'polvora',
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
        locationEs: 'Calle de la Paz hasta Porta de la Mar',
        locationEn: 'Calle de la Paz to Porta de la Mar',
      },
      {
        id: '19-crema-infantiles-20',
        time: '20:00',
        titleEs: 'Cremà de las fallas infantiles',
        titleEn: 'Cremà of children\'s fallas',
        category: 'fuego',
      },
      {
        id: '19-crema-infantil-especial-20',
        time: '20:30',
        titleEs: 'Cremà de la falla infantil, primer premio Sección Especial',
        titleEn: 'Cremà of the winning children\'s falla in Special Section',
        category: 'fuego',
      },
      {
        id: '19-crema-infantil-ayto-21',
        time: '21:00',
        titleEs: 'Cremà de la falla infantil de la Plaza del Ayuntamiento',
        titleEn: 'Cremà of the children\'s falla in City Hall Square',
        category: 'fuego',
        locationEs: 'Plaza del Ayuntamiento',
        locationEn: 'City Hall Square',
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
    <div className="flex flex-col text-terreta-dark min-h-0">
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-3 flex-wrap bg-terreta-card py-3 border-b border-terreta-border/70 mb-4"
        aria-label={t('Cabecera del programa', 'Schedule header')}
      >
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
