import React from 'react';

export const FallasSafetyPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Seguridad y multitudes
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Millones de personas, toneladas de pólvora y monumentos ardiendo en plena calle. La fiesta está muy
          controlada, pero hay trucos básicos para disfrutarla con calma.
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          Consejos rápidos
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>Lleva el móvil y la cartera siempre en bolsillos frontales o bandolera cruzada.</li>
          <li>Usa tapones para las mascletàs: el sonido supera fácilmente los 120 dB.</li>
          <li>Antes de ver una cremà, identifica salidas claras y espacios amplios a tu alrededor.</li>
          <li>Si tienes problemas respiratorios, evita situarte a favor del viento del humo.</li>
        </ul>
      </section>
    </div>
  );
};

