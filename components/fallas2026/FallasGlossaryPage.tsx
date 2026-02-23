import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

const terms: { term: string; definitionEs: string; definitionEn: string }[] = [
  {
    term: 'Falla',
    definitionEs:
      'Nombre del festival y de cada uno de los monumentos que se plantan en la calle y se queman la noche del 19 de marzo.',
    definitionEn:
      'Name of the festival and of each monument erected in the street and burned on the night of 19 March.',
  },
  {
    term: 'Ninot',
    definitionEs:
      'Figura individual que forma parte de una falla. Suelen ser personajes satíricos, políticos o de cultura popular.',
    definitionEn:
      'Individual figure that is part of a falla. Usually satirical, political or popular culture characters.',
  },
  {
    term: 'Ninot Indultat',
    definitionEs:
      'El ninot "indultado" por votación popular que se salva del fuego y pasa a formar parte del Museo Fallero.',
    definitionEn:
      'The ninot "pardoned" by popular vote that is saved from the fire and goes to the Fallero Museum.',
  },
  {
    term: 'Mascletà',
    definitionEs:
      'Espectáculo de pirotecnia diurna centrado en el sonido y la vibración, celebrado cada día a las 14:00 en la Plaza del Ayuntamiento.',
    definitionEn:
      'Daytime pyrotechnic show focused on sound and vibration, held every day at 14:00 in City Hall Square.',
  },
  {
    term: 'Nit del Foc',
    definitionEs:
      'La "Noche del Fuego", el castillo de fuegos artificiales más potente de Fallas, la noche del 18 de marzo.',
    definitionEn:
      '"Night of Fire", the most powerful firework display of Fallas, on the night of 18 March.',
  },
  {
    term: 'Cremà',
    definitionEs:
      'Quema de todas las fallas la noche del 19 de marzo. Las infantiles arden antes; la falla municipal suele ser la última.',
    definitionEn:
      'Burning of all fallas on the night of 19 March. Children’s fallas burn first; the municipal falla is usually last.',
  },
  {
    term: 'Ofrenda',
    definitionEs:
      'Ofrenda de flores a la Virgen de los Desamparados, en la que miles de falleras y falleros desfilan hacia la Plaza de la Virgen.',
    definitionEn:
      'Flower offering to the Virgin of the Forsaken, in which thousands of falleras and falleros parade to Plaza de la Virgen.',
  },
  {
    term: 'Despertà',
    definitionEs:
      'Pasacalle madrugador en el que se lanzan petardos y se toca música para "despertar" a la ciudad.',
    definitionEn:
      'Early-morning parade with firecrackers and music to "wake up" the city.',
  },
  {
    term: 'Verbenas',
    definitionEs:
      'Fiestas de calle organizadas por las comisiones falleras, con música, barra y baile hasta la madrugada.',
    definitionEn:
      'Street parties organised by fallera commissions, with music, a bar and dancing until the early hours.',
  },
];

export const FallasGlossaryPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Glosario rápido de Fallas', 'Quick Fallas glossary')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Si es tu primera vez en Fallas, este pequeño diccionario te ayudará a seguir las conversaciones locales y a entender los carteles y programas oficiales.',
            'If it is your first time at Fallas, this short dictionary will help you follow local conversations and understand official posters and programmes.'
          )}
        </p>
      </header>

      <dl className="divide-y divide-terreta-border rounded-2xl border border-terreta-border bg-terreta-bg max-w-3xl">
        {terms.map((item) => (
          <div key={item.term} className="p-4 md:p-5">
            <dt className="text-sm md:text-base font-semibold text-terreta-dark mb-1">
              {item.term}
            </dt>
            <dd className="text-sm md:text-base text-terreta-dark leading-relaxed">
              {language === 'es' ? item.definitionEs : item.definitionEn}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
