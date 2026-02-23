import React from 'react';

export const FallasCulturePage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Cultura, exposiciones y monumentos
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Fallas es también un museo al aire libre: Exposición del Ninot, Museo Fallero y cientos de monumentos
          repartidos por toda la ciudad, muchos con presupuestos de seis cifras.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          La{' '}
          <span className="font-semibold">
            Exposición del Ninot
          </span>{' '}
          en la Ciutat de les Arts permite ver de cerca cientos de figuras y votar el Ninot Indultat, el único que se
          salvará del fuego ese año.
        </p>
        <p>
          El{' '}
          <span className="font-semibold">
            Museo Fallero
          </span>{' '}
          guarda décadas de ninots indultados y es una forma rápida de entender cómo ha cambiado el humor y la
          política local desde mediados del siglo XX hasta hoy.
        </p>
      </section>
    </div>
  );
};

