import { SCHEDULE_2026 } from './FallasSchedulePage';

type Lang = 'es' | 'en';

export interface PdfSection {
  title: string;
  lines: string[];
}

export function getFallasGuidePdfContent(lang: Lang): { title: string; sections: PdfSection[] } {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);

  const scheduleLines: string[] = [
    lang === 'es'
      ? 'Programa oficial desde el 28 de febrero hasta el 19 de marzo (incluye visitas, mascletàs, ofrenda, premios, L\'Alba, Nit del Foc y Cremà).'
      : 'Official programme from 28 February to 19 March (includes visits, mascletàs, flower offering, awards, L\'Alba, Nit del Foc and Cremà).',
    '',
  ];
  for (const day of SCHEDULE_2026) {
    const dayLabel = lang === 'es' ? day.dayLabelEs : day.dayLabelEn;
    scheduleLines.push(dayLabel);
    for (const ev of day.events) {
      const title = lang === 'es' ? ev.titleEs : ev.titleEn;
      const loc = lang === 'es' ? ev.locationEs : ev.locationEn;
      scheduleLines.push(`  ${ev.time} — ${title}${loc ? ` · ${loc}` : ''}`);
    }
    scheduleLines.push('');
  }

  return {
    title: t('Fallas 2026: Guía completa', 'Fallas 2026: Complete Guide'),
    sections: [
      {
        title: t('En esta guía encontrarás', 'In this guide you will find'),
        lines: [
          t('Resumen claro de qué es Fallas y por qué es tan importante en Valencia.', 'Clear summary of what Fallas is and why it matters so much in Valencia.'),
          t('Calendario 2026 con los momentos que no te puedes perder.', '2026 calendar with the moments you should not miss.'),
          t('Cómo moverte por la ciudad cuando el tráfico está patas arriba.', 'How to move around the city when traffic is upside down.'),
          t('Consejos muy concretos sobre ruido, humo, niños y mascotas.', 'Very concrete tips about noise, smoke, kids and pets.'),
        ],
      },
      {
        title: t('Qué es Fallas', 'What is Fallas'),
        lines: [
          t('Si eres nuevo en Valencia, Fallas (Les Falles en valenciano) es el gran festival de la ciudad y uno de los más intensos de Europa. Es arte efímero, pólvora, música y vida en la calle durante casi tres semanas.', 'If you are new to Valencia, Fallas (Les Falles in Valencian) is the city’s biggest festival and one of the most intense in Europe. It is ephemeral art, gunpowder, music and street life for almost three weeks.'),
          t('A nivel práctico, Fallas consiste en que cientos de barrios construyen monumentos gigantescos —las fallas— que combinan sátira política, humor local y escenas fantásticas. Se plantan en la calle a mediados de marzo y se queman todas la noche del 19, en un ritual llamado la Cremà.', 'In practice, Fallas means hundreds of neighbourhoods build huge monuments —the fallas— that mix political satire, local humour and fantasy scenes. They are erected in the street in mid-March and burned on the night of the 19th in a ritual called the Cremà.'),
          t('Cada monumento nace de una comisión fallera, una asociación vecinal que pasa todo el año organizando loterías, cenas y eventos para pagar su falla. Las comisiones son el corazón social del festival.', 'Each monument comes from a fallera commission, a neighbourhood association that spends the whole year organising raffles, dinners and events to pay for their falla. The commissions are the social heart of the festival.'),
          t('Lo que nadie te cuenta antes de tu primera Fallas: Cerrar las ventanas no es opcional; el sueño es negociable; tu trayecto habitual se dobla por cierres; Fallas no es solo el centro.', 'What nobody tells you before your first Fallas: Closing the windows is not optional; sleep is negotiable; your usual route doubles due to closures; Fallas is not just the city centre.'),
        ],
      },
      {
        title: t('Fechas y programa 2026', 'Dates & Schedule 2026'),
        lines: scheduleLines,
      },
      {
        title: t('Cómo moverse durante Fallas', 'Getting around during Fallas'),
        lines: [
          t('València cuenta con una red de transporte público moderna y bien conectada. Si vas a utilizar el transporte con frecuencia y llegar desde el aeropuerto, te recomendamos la Valencia Tourist Card.', 'València has a modern, well-connected public transport network. If you plan to use it often and arrive from the airport, we recommend the Valencia Tourist Card.'),
          t('Billetes sencillos: en autobús alrededor de 2 € por trayecto; en metro el precio varía según la zona (desde ~1,50 € más tarjeta hasta ~4,80 € aeropuerto).', 'Single tickets: on buses around €2 per journey; on the metro the price depends on the zone (from ~€1.50 plus card to ~€4.80 for the airport).'),
          t('Durante Fallas se refuerzan frecuencias y a menudo hay desvíos por cortes de tráfico; comprueba siempre el recorrido en la app oficial.', 'During Fallas services are reinforced and routes are often diverted; always check your route in the official app.'),
        ],
      },
      {
        title: t('Seguridad & Mascotas', 'Safety & Pets'),
        lines: [
          t('Consejos rápidos: Lleva el móvil y la cartera en bolsillos frontales o bandolera cruzada. Usa tapones para las mascletàs (superan 120 dB). Antes de una cremà, identifica salidas claras. Si tienes problemas respiratorios, evita situarte a favor del viento del humo.', 'Quick tips: Keep your phone and wallet in front pockets or a cross-body bag. Use earplugs for mascletàs (they exceed 120 dB). Before a cremà, identify clear exits. If you have breathing problems, avoid staying downwind of the smoke.'),
          t('Para muchos perros y gatos, Fallas no es una fiesta: es semanas de explosiones constantes. Habla con tu veterinario con tiempo si tu mascota es sensible al ruido.', 'For many dogs and cats, Fallas is not a party: it is weeks of constant explosions. Talk to your vet in advance if your pet is noise-sensitive.'),
          t('Durante mascletàs, Nit del Foc y la noche de la Cremà, mantén puertas y ventanas cerradas y crea un espacio interior donde el animal pueda refugiarse.', 'During mascletàs, Nit del Foc and Cremà night, keep doors and windows closed and create an indoor space where the animal can take refuge.'),
          t('Horas de descanso recomendadas (Bando 2026): no disparar petardos entre 15:00 y 17:00 h ni entre 09:00 y 10:00 h. Prohibido disparar pirotecnia en el Jardín del Turia y zonas de juegos infantiles.', 'Recommended rest times (2026 bylaw): do not set off firecrackers between 15:00 and 17:00 or between 09:00 and 10:00. Fireworks are prohibited in the Turia Gardens and children\'s play areas.'),
        ],
      },
      {
        title: t('Cultura y exposiciones', 'Culture and exhibitions'),
        lines: [
          t('Exposición del Ninot en la Ciutat de les Arts: ver de cerca cientos de figuras y votar el Ninot Indultat. El Museo Fallero guarda décadas de ninots indultados y muestra la evolución del humor y la política local.', 'Ninot Exhibition at the City of Arts and Sciences: see hundreds of figures up close and vote for the Ninot Indultat. The Fallero Museum holds decades of indulted ninots and shows the evolution of local humour and politics.'),
        ],
      },
      {
        title: t('Consejos prácticos', 'Practical tips'),
        lines: [
          t('Normas útiles: Puestos de buñuelos autorizados del 2 al 19 de marzo. Opciones para celíacos con harinas certificadas y separación en el puesto. Comisiones con verbenas deben garantizar aseos portátiles 24 h. Verbenas autorizadas 22:00–04:00 (noches 7, 14, 16, 17 y 18 marzo).', 'Useful rules: Buñuelo stalls authorised 2–19 March. Coeliac options with certified flour and physical separation at the stall. Commissions organising verbenas must provide portable toilets 24 h. Verbenas authorised 22:00–04:00 (nights of 7, 14, 16, 17 and 18 March).'),
          t('Supervivencia básica: Zapatillas cómodas y cerradas; capas de ropa; no estrenar outfit favorito la noche de la Cremà; reservar para comer o plan bocadillo + buñuelos.', 'Basic survival: Comfortable closed shoes; layered clothing; don’t wear your favourite outfit on Cremà night; book to eat out or go for sandwich + buñuelos.'),
        ],
      },
      {
        title: t('Más allá de Valencia', 'Beyond Valencia'),
        lines: [
          t('Top 10 ciudades falleras (sin València): Alzira (34 comisiones, Cercanías C2), Sagunto (30, C6/C5), Torrent (28–29, Metro 1/2/7), Gandia (23, C1), Xàtiva (19, C2), Paterna (18, Metro/C3), Sueca (16, Media Distancia/bus), Cullera (16, C1), Burriana (~15, C6), Dénia (~decena, FGV/bus). Todas con Sección Especial o secciones altas.', 'Top 10 fallera cities (excluding València): Alzira (34 commissions, Cercanías C2), Sagunto (30, C6/C5), Torrent (28–29, Metro 1/2/7), Gandia (23, C1), Xàtiva (19, C2), Paterna (18, Metro/C3), Sueca (16, Media Distancia/bus), Cullera (16, C1), Burriana (~15, C6), Dénia (~dozen, FGV/bus). All with Special Section or high sections.'),
          t('Alzira: Fallas declaradas Fiesta de Interés Turístico Nacional; proyecto "Fallers pel Món" exporta plantà y cremà a otras ciudades.', 'Alzira: Fallas declared Fiesta of National Tourist Interest; "Fallers pel Món" project exports plantà and cremà to other cities.'),
          t('Gandia: desde 2027, nueva clasificación en secciones por censo fallero oficial (sistema más justo y sostenible).', 'Gandia: from 2027, new section classification by official fallero census (fairer, more sustainable system).'),
          t('Por tipo de escapada: A un paso del Metro (Torrent, Paterna, Burjassot, Mislata, Xirivella). Escapada de un día (Sagunto, Alzira, Xàtiva). Brisa marina (Gandia, Cullera, Dénia). Cartagena: Fallas recientes, identidad mediterránea.', 'By trip type: One step from Metro (Torrent, Paterna, Burjassot, Mislata, Xirivella). Day trip (Sagunto, Alzira, Xàtiva). By the sea (Gandia, Cullera, Dénia). Cartagena: recent Fallas, Mediterranean identity.'),
        ],
      },
      {
        title: t('Glosario fallero', 'Fallas glossary'),
        lines: [
          'Falla: ' + t('Nombre del festival y de cada monumento que se quema la noche del 19.', 'Name of the festival and of each monument burned on the night of the 19th.'),
          'Ninot: ' + t('Figura individual de una falla, satírica o de cultura popular.', 'Individual figure in a falla, satirical or from popular culture.'),
          'Ninot Indultat: ' + t('El ninot votado que se salva del fuego y va al Museo Fallero.', 'The voted ninot that is saved from the fire and goes to the Fallero Museum.'),
          'Mascletà: ' + t('Espectáculo pirotécnico diurno a las 14:00 en Plaza del Ayuntamiento.', 'Daytime pyrotechnic show at 14:00 in City Hall Square.'),
          'Nit del Foc: ' + t('Noche del Fuego, castillo más potente la noche del 18.', 'Night of Fire, the most powerful firework display on the night of the 18th.'),
          'Cremà: ' + t('Quema de todas las fallas la noche del 19.', 'Burning of all fallas on the night of the 19th.'),
          'Ofrenda: ' + t('Ofrenda de flores a la Virgen; miles de falleros desfilan a Plaza de la Virgen.', 'Flower offering to the Virgin; thousands of falleros parade to Plaza de la Virgen.'),
          'Despertà: ' + t('Pasacalle madrugador con petardos y música.', 'Early-morning parade with firecrackers and music.'),
          'Verbenas: ' + t('Fiestas de calle de las comisiones con música y barra hasta la madrugada.', 'Street parties organised by commissions with music and a bar until the early hours.'),
        ],
      },
    ],
  };
}
