import React from 'react';

export const FallasGettingAroundPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Cómo moverse durante Fallas
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Metro, EMT, Cercanías, Valenbisi y, sobre todo, tus propios pies. Aquí condensaremos horarios especiales,
          cierres de estaciones y trucos para no perder media tarde en un desvío.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          · Metrovalencia suele funcionar 24/7 del 15 al 19 de marzo, pero estaciones como Xàtiva y Colón cierran a la
          hora de la mascletà por seguridad. Ten siempre un plan B (Bailén, Ángel Guimerà...).
        </p>
        <p>
          · La EMT refuerza líneas y activa buses nocturnos, pero muchas rutas cambian por cortes de tráfico. La app
          oficial es tu mejor aliada para saber por dónde pasa realmente tu bus esa noche.
        </p>
      </section>
    </div>
  );
};

