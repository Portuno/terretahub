import React from 'react';

export const FallasPetsPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Mascotas y bienestar animal
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Para muchos perros y gatos, Fallas no es una fiesta: es semanas de explosiones constantes. Esta guía se
          centrará en minimizar el estrés de los animales durante el festival.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          · Habla con tu veterinario con tiempo si tu mascota es especialmente sensible al ruido. Hay tratamientos
          específicos y protocolos recomendados para estos días.
        </p>
        <p>
          · Durante mascletàs, Nit del Foc y la noche de la Cremà, mantén puertas y ventanas cerradas y crea un espacio
          interior donde el animal pueda refugiarse con mantas y música suave.
        </p>
      </section>
    </div>
  );
};

