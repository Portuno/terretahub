import React from 'react';

export const FallasTipsPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Consejos prácticos
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Qué comer, cómo vestirse y qué esperar del día a día durante Fallas. Esta sección recoge trucos que normalmente
          solo te cuenta alguien que ya ha pasado por su primera semana fallera.
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          Supervivencia básica
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>Zapatillas cómodas y cerradas: vas a caminar mucho y el suelo está lleno de restos de petardos.</li>
          <li>Capas de ropa: marzo en Valencia puede pasar de solazo a aire frío en cuestión de horas.</li>
          <li>No estrenes tu outfit favorito la noche de la Cremà: el olor a humo se queda varios lavados.</li>
          <li>Reserva para comer fuera en los días clave o abraza el plan bocadillo + buñuelos.</li>
        </ul>
      </section>
    </div>
  );
};

