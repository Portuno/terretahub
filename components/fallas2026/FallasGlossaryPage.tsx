import React from 'react';

const terms = [
  {
    term: 'Falla',
    definition:
      'Nombre del festival y de cada uno de los monumentos que se plantan en la calle y se queman la noche del 19 de marzo.',
  },
  {
    term: 'Ninot',
    definition:
      'Figura individual que forma parte de una falla. Suelen ser personajes satíricos, políticos o de cultura popular.',
  },
  {
    term: 'Ninot Indultat',
    definition:
      'El ninot “indultado” por votación popular que se salva del fuego y pasa a formar parte del Museo Fallero.',
  },
  {
    term: 'Mascletà',
    definition:
      'Espectáculo de pirotecnia diurna centrado en el sonido y la vibración, celebrado cada día a las 14:00 en la Plaza del Ayuntamiento.',
  },
  {
    term: 'Nit del Foc',
    definition:
      'La “Noche del Fuego”, el castillo de fuegos artificiales más potente de Fallas, la noche del 18 de marzo.',
  },
  {
    term: 'Cremà',
    definition:
      'Quema de todas las fallas la noche del 19 de marzo. Las infantiles arden antes; la falla municipal suele ser la última.',
  },
  {
    term: 'Ofrenda',
    definition:
      'Ofrenda de flores a la Virgen de los Desamparados, en la que miles de falleras y falleros desfilan hacia la Plaza de la Virgen.',
  },
  {
    term: 'Despertà',
    definition:
      'Pasacalle madrugador en el que se lanzan petardos y se toca música para “despertar” a la ciudad.',
  },
  {
    term: 'Verbenas',
    definition:
      'Fiestas de calle organizadas por las comisiones falleras, con música, barra y baile hasta la madrugada.',
  },
];

export const FallasGlossaryPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Glosario rápido de Fallas
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Si es tu primera vez en Fallas, este pequeño diccionario te ayudará a seguir las conversaciones locales y a
          entender los carteles y programas oficiales.
        </p>
      </header>

      <dl className="divide-y divide-terreta-border rounded-2xl border border-terreta-border bg-terreta-bg max-w-3xl">
        {terms.map((item) => (
          <div key={item.term} className="p-4 md:p-5">
            <dt className="text-sm md:text-base font-semibold text-terreta-dark mb-1">
              {item.term}
            </dt>
            <dd className="text-sm md:text-base text-terreta-dark leading-relaxed">
              {item.definition}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

