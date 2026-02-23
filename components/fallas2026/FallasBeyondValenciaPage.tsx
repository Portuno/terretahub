import React from 'react';

export const FallasBeyondValenciaPage: React.FC = () => {
  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          Fallas más allá de Valencia ciudad
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          Torrent, Cartagena y decenas de pueblos de la Comunitat Valenciana celebran sus propias fallas, muchas con un
          ambiente más local y relajado que el centro de Valencia.
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          · <span className="font-semibold">Torrent</span>: ciudad al sur de Valencia con programa propio y un ambiente
          muy familiar. Su castillo de fuegos suele ser uno de los más potentes de la comarca.
        </p>
        <p>
          · <span className="font-semibold">Cartagena</span>: incorporó las Fallas recientemente, mezclando tradición
          valenciana con su propia identidad mediterránea y un claro objetivo de atraer turismo primaveral.
        </p>
      </section>
    </div>
  );
};

