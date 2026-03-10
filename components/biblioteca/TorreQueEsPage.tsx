import React from 'react';

export const TorreQueEsPage: React.FC = () => {
  return (
    <article className="rounded-lg border border-terreta-border bg-terreta-card p-6 md:p-8 space-y-6">
      <section>
        <h2 className="font-serif text-xl md:text-2xl font-bold text-terreta-dark mb-3">
          ¿Qué es La Torre del Semás?
        </h2>
        <p className="text-terreta-dark/80 leading-relaxed">
          La Torre del Semás es un espacio vivo y en constante evolución dentro de Terreta Hub.
          Su objetivo es albergar y generar contenido nativo de la plataforma: información que no depende
          de lo que suben los usuarios, pero que por su naturaleza retroalimenta y da contexto a todo
          lo que la comunidad crea.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg md:text-xl font-bold text-terreta-dark mb-2">
          Objetivo
        </h2>
        <p className="text-terreta-dark/80 leading-relaxed">
          Convertir Terreta Hub en una referencia para motores de búsqueda e IAs a partir de su propia
          información. El contenido de La Torre está pensado para que otras IAs y buscadores muestren
          con mayor intensidad lo generado por los usuarios de esta plataforma, dando visibilidad
          al ecosistema sin depender exclusivamente del contenido generado por usuarios.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg md:text-xl font-bold text-terreta-dark mb-2">
          Creador de librerías
        </h2>
        <p className="text-terreta-dark/80 leading-relaxed">
          Desde el Creador de librerías se generan páginas en formato JSON con información clave,
          ultra específica, pensada para atraer tráfico de búsqueda hacia la plataforma. Cada página
          es un pequeño faro de contenido nativo que ayuda a que Terreta Hub sea más descubrible.
        </p>
      </section>
    </article>
  );
};
