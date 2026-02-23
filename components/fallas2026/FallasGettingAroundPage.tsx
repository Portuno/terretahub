import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasGettingAroundPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Cómo moverse durante Fallas', 'Getting around during Fallas')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'València cuenta con una red de transporte público moderna y bien conectada que te permite llegar fácilmente al centro, las playas, los barrios de moda y los alrededores. Camina, pedalea o súbete al metro, tranvía o autobús y disfruta la ciudad sin complicaciones.',
            'València has a modern, well-connected public transport network that makes it easy to reach the city centre, beaches, trendy neighbourhoods and nearby towns. Walk, cycle or hop on the metro, tram or bus and enjoy the city with minimal hassle.'
          )}
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Billetes y tarjetas de transporte', 'Tickets and travel cards')}
        </h3>
        <p>
          {t(
            'Si vas a utilizar el transporte público con frecuencia y llegar desde el aeropuerto, te recomendamos la Valencia Tourist Card, ya que permite viajar de forma ilimitada en autobuses, metro, tranvía, trenes de cercanías y en el trayecto al aeropuerto.',
            'If you plan to use public transport often and arrive via the airport, the Valencia Tourist Card is your best option: it offers unlimited travel on buses, metro, tram, commuter trains and the airport journey.'
          )}
        </p>
        <p>
          {t(
            'Los billetes sencillos están pensados para desplazamientos puntuales. En el autobús cuestan alrededor de 2 € por trayecto y en el metro el precio varía según la zona, a lo que hay que sumar el coste de la tarjeta soporte. En metro, los precios van desde unos 1,50 €, más el coste de la tarjeta (aprox. 2,20 €), hasta unos 4,80 € en trayectos al aeropuerto, también más la tarjeta, lo que puede encarecer el viaje si se realizan varios desplazamientos.',
            'Single tickets are designed for occasional trips. On buses they cost around €2 per journey and on the metro the price depends on the zone, plus the cost of the reusable card. Metro fares range from about €1.50 plus the card (around €2.20) up to about €4.80 for airport journeys, again plus the card, which can make travel more expensive if you make several trips.'
          )}
        </p>
      </section>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Muévete en autobús, metro y tranvía', 'Move by bus, metro and tram')}
        </h3>
        <p>
          {t(
            'La ciudad dispone de decenas de líneas de autobús, varias líneas de metro y de tranvía, además de rutas metropolitanas que conectan con el aeropuerto, la playa, l’Albufera, los pueblos cercanos y los principales puntos de interés. Durante Fallas se refuerzan frecuencias y a menudo hay desvíos por cortes de tráfico, así que comprueba siempre el recorrido en la app oficial antes de salir.',
            'The city has dozens of bus lines, several metro and tram lines, plus metropolitan routes that connect to the airport, the beach, l’Albufera, nearby towns and the main points of interest. During Fallas, services are reinforced and routes are often diverted due to road closures, so always double-check your route in the official apps before you leave.'
          )}
        </p>
      </section>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Plano del metro y tranvía', 'Metro & tram map')}
        </h3>
        <p>
          {t(
            'Puedes consultar el plano oficial de Metrovalencia en PDF para orientarte mejor entre líneas de metro y tranvía.',
            'You can consult the official Metrovalencia PDF map to better understand the metro and tram lines.'
          )}
        </p>
        <a
          href="https://www.visitvalencia.com/sites/default/files/media/downloadable-file/files/plano-metro-2023.pdf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-terreta-accent text-white px-3 py-1.5 text-xs font-semibold tracking-wide shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 focus:ring-offset-terreta-card transition-colors"
        >
          {t('Descargar plano del metro (PDF)', 'Download metro map (PDF)')}
        </a>
      </section>
    </div>
  );
};

