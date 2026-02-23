import React from 'react';

export const FallasWhereToWatchPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Dónde ver los momentos clave
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Plaza del Ayuntamiento, Ruzafa, El Carmen, Benimaclet... esta sección recogerá rutas y puntos estratégicos
          para cada tipo de evento: mascletàs, castillos, ofrenda y Cremà.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          Para la{' '}
          <span className="font-semibold">
            mascletà diaria
          </span>{' '}
          la clave no es ver, sino sentir. Las calles alrededor de la plaza —Barcas, Correos— suelen ofrecer buenas
          vistas con algo menos de presión que el centro mismo.
        </p>
        <p>
          En la{' '}
          <span className="font-semibold">
            Cremà
          </span>{' '}
          la mejor experiencia suele estar en fallas de barrio medianas: estás más cerca del fuego, ves trabajar a los
          bomberos y puedes moverte entre varios monumentos en la misma zona.
        </p>
      </section>
    </div>
  );
};

