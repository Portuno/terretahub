import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TOTES_REWARD_PER_TOPIC, TOTES_TOPICS, type TotesTopicKey } from '../lib/totes';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

const TOPIC_LABELS: Record<TotesTopicKey, string> = {
  perfil: 'Perfil',
  foro: 'Ágora (foro)',
  mapa: 'Mapa',
  recursos: "L'Almoina (recursos)",
  comunidad: 'Comunidad',
  dominio: 'Dominio',
  feedback: 'Feedback'
};

export const TerrisPage: React.FC = () => {
  const navigate = useNavigate();

  useDynamicMetaTags({
    title: 'Terris · Terreta Hub',
    description:
      'Los Terris son la moneda blanda de Terreta Hub: cómo ganarlos, para qué sirven y qué viene.',
    url: '/terris'
  });

  return (
    <div className="min-h-full bg-terreta-bg py-8 px-4 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate('/explorar')}
            className="mb-4 text-sm font-semibold text-terreta-accent transition-colors hover:text-terreta-dark"
          >
            ← Volver
          </button>
          <h1 className="mb-2 font-serif text-3xl font-bold text-terreta-dark md:text-4xl">Terris</h1>
          <p className="text-sm text-terreta-dark/60">
            Moneda nativa y local de la Terreta — cómo se gana, para qué vale y hacia dónde vamos.
          </p>
        </div>

        <div className="space-y-8 rounded-lg border border-terreta-border bg-terreta-card p-6 shadow-sm md:p-8">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-terreta-dark md:text-2xl">Qué son</h2>
            <p className="leading-relaxed text-terreta-dark/85">
              Los <strong className="text-terreta-dark">Terris</strong> son la moneda blanda de Terreta Hub: sirven
              para reconocer que explorás la plataforma y completás recorridos por cada área. En la interfaz los ves
              como Terris; en sistemas internos la misma unidad puede figurar con el nombre técnico anterior
              (totes), pero para vos siempre son Terris.
            </p>
            <p className="leading-relaxed text-terreta-dark/85">
              Tu saldo aparece en la barra superior, junto al ícono de monedas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-terreta-dark md:text-2xl">Cómo conseguirlos</h2>
            <p className="leading-relaxed text-terreta-dark/85">
              Por cada <strong className="text-terreta-dark">área</strong> que completes por primera vez en tu
              recorrido, se acreditan{' '}
              <strong className="text-terreta-accent">{TOTES_REWARD_PER_TOPIC} Terris</strong>. Las áreas son:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-1 text-terreta-dark/85">
              {TOTES_TOPICS.map((key) => (
                <li key={key}>
                  <span className="font-medium text-terreta-dark">{TOPIC_LABELS[key]}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-terreta-secondary">
              Si ya completaste un área, no se vuelve a pagar por la misma; la idea es premiar el recorrido inicial
              y mantener la economía simple.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-terreta-dark md:text-2xl">Usos hoy y próximos</h2>
            <p className="leading-relaxed text-terreta-dark/85">
              Hoy los Terris reflejan tu participación y acumulación en el Hub: son una señal de que recorriste las
              piezas clave del producto. La dirección es que dejen de ser solo un número: cosméticos, insignias,
              desbloqueos suaves y utilidades que no rompan el equilibrio entre quien entra todos los días y quien
              participa a su ritmo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-terreta-dark md:text-2xl">Roadmap (dirección)</h2>
            <ul className="list-inside list-disc space-y-2 text-terreta-dark/85">
              <li>Misiones o retos claros vinculados al Ágora, al perfil y a los espacios comunitarios.</li>
              <li>Usos visibles en perfil (marcos, colecciones, reconocimientos) con reglas transparentes.</li>
              <li>Comunicar cambios de balance y recompensas de forma entendible, sin sorpresas desleales.</li>
            </ul>
            <p className="text-sm text-terreta-secondary">
              Los detalles y fechas los iremos anunciando en la propia plataforma cuando estén cerrados.
            </p>
          </section>

          <div className="border-t border-terreta-border pt-6">
            <Link
              to="/explorar"
              className="inline-flex items-center justify-center rounded-lg border border-terreta-accent bg-terreta-accent/10 px-4 py-2 text-sm font-semibold text-terreta-accent transition-colors hover:bg-terreta-accent/20"
            >
              Volver al Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
