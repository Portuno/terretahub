import React from 'react';

export const FallasSchedulePage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Fechas y programa 2026
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Aquí tendrás el calendario detallado de Fallas 2026: desde la Crida y la Exposición del Ninot hasta la Nit del
          Foc y la Cremà. De momento, esta sección muestra un resumen básico mientras preparamos el sistema de
          calendario interactivo.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          <span className="font-semibold">Pre-Fallas (finales de enero y febrero):</span>{' '}
          apertura oficial, primeros fuegos artificiales y Exposición del Ninot.
        </p>
        <p>
          <span className="font-semibold">1–14 de marzo:</span>{' '}
          mascletàs diarias en la Plaza del Ayuntamiento a las 14:00 y castillos de fuegos en distintos barrios.
        </p>
        <p>
          <span className="font-semibold">15–19 de marzo (semana grande):</span>{' '}
          plantà de las fallas, ofrenda de flores, Nit del Foc y, el día 19, la Cremà de todos los monumentos.
        </p>
      </section>
    </div>
  );
};

