import React from 'react';

export const FallasWhatIsPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Qué es Fallas
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Si eres nuevo en Valencia, Fallas (Les Falles en valenciano) es el gran festival de la ciudad y uno de los
          más intensos de Europa. Es arte efímero, pólvora, música y vida en la calle durante casi tres semanas.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          A nivel práctico, Fallas consiste en que cientos de barrios construyen monumentos gigantescos
          —las fallas— que combinan sátira política, humor local y escenas fantásticas. Se plantan en la calle a
          mediados de marzo y se queman todas la noche del 19, en un ritual llamado la Cremà.
        </p>
        <p>
          Cada monumento nace de una comisión fallera, una asociación vecinal que pasa todo el año organizando
          loterías, cenas y eventos para pagar su falla. Las comisiones son el corazón social del festival: sin ellas
          no habría ninots, verbenas ni ofrenda de flores.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          Lo que nadie te cuenta antes de tu primera Fallas
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>Cerrar las ventanas no es opcional: a partir del 1 de marzo la ciudad suena y huele a pólvora.</li>
          <li>El sueño es negociable: entre despertàs, verbenas y petardos nocturnos, dormir del tirón es raro.</li>
          <li>Tu trayecto habitual se dobla: muchas calles se cierran y los desvíos son parte del juego.</li>
          <li>Fallas no es solo el centro: en los barrios la fiesta es más manejable y a menudo más auténtica.</li>
        </ul>
      </section>
    </div>
  );
};

