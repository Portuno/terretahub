import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';
import { Train, Sun, MapPin, Sparkles } from 'lucide-react';

type Lang = 'es' | 'en';

interface TopCity {
  name: string;
  commissionsEs: string;
  commissionsEn: string;
  specialSectionEs: string;
  specialSectionEn: string;
  transportEs: string;
  transportEn: string;
  commentEs: string;
  commentEn: string;
}

const TOP_10_CITIES: TopCity[] = [
  {
    name: 'Alzira',
    commissionsEs: '34 comisiones',
    commissionsEn: '34 commissions',
    specialSectionEs: 'Sí, con fallas punteras y premios altos.',
    specialSectionEn: 'Yes, with top fallas and major awards.',
    transportEs: 'Cercanías C2 (València Nord → Alzira), 35–40 min.',
    transportEn: 'Cercanías C2 (València Nord → Alzira), 35–40 min.',
    commentEs: 'Ciudad mediana muy volcada en las Fallas; estilo "mini-València" pero más manejable.',
    commentEn: 'Medium-sized city very committed to Fallas; "mini-València" feel but more manageable.',
  },
  {
    name: 'Sagunto',
    commissionsEs: '30 comisiones',
    commissionsEn: '30 commissions',
    specialSectionEs: 'Sí, fallas de secciones altas y premios destacados.',
    specialSectionEn: 'Yes, high-section fallas and notable awards.',
    transportEs: 'Cercanías C6 (València Nord → Sagunt) o C5 hasta Port de Sagunt + bus local.',
    transportEn: 'Cercanías C6 (València Nord → Sagunt) or C5 to Port de Sagunt + local bus.',
    commentEs: 'Mezcla casco histórico y Port; ambiente potente sin la saturación del centro de València.',
    commentEn: 'Historic centre and port combined; strong vibe without central Valencia\'s saturation.',
  },
  {
    name: 'Torrent',
    commissionsEs: '28–29 comisiones',
    commissionsEn: '28–29 commissions',
    specialSectionEs: 'Sí, 8 fallas en Sección Especial en 2026.',
    specialSectionEn: 'Yes, 8 fallas in Special Section in 2026.',
    transportEs: 'Metro líneas 1, 2 y 7 (Torrent, Torrent Avinguda), 15–25 min desde el centro.',
    transportEn: 'Metro lines 1, 2 and 7 (Torrent, Torrent Avinguda), 15–25 min from centre.',
    commentEs: 'Gran ciudad fallera del área metropolitana; muy accesible en metro para visitas rápidas.',
    commentEn: 'Major fallera city in the metro area; very accessible by metro for quick visits.',
  },
  {
    name: 'Gandia',
    commissionsEs: '23 comisiones',
    commissionsEn: '23 commissions',
    specialSectionEs: 'Sí, con una Sección Especial propia.',
    specialSectionEn: 'Yes, with its own Special Section.',
    transportEs: 'Cercanías C1 (València Nord → Gandia), 55–65 min.',
    transportEn: 'Cercanías C1 (València Nord → Gandia), 55–65 min.',
    commentEs: 'Perfil más turístico y joven; buen mix de playa + pólvora + ocio nocturno.',
    commentEn: 'More touristy and youthful; great mix of beach + gunpowder + nightlife.',
  },
  {
    name: 'Xàtiva',
    commissionsEs: '19 comisiones',
    commissionsEn: '19 commissions',
    specialSectionEs: 'Sí, fallas en secciones y premios principales.',
    specialSectionEn: 'Yes, fallas in sections and main awards.',
    transportEs: 'Cercanías C2 (València Nord → Xàtiva), 50–60 min.',
    transportEn: 'Cercanías C2 (València Nord → Xàtiva), 50–60 min.',
    commentEs: 'Casco histórico y castillo como telón de fondo; muy fotogénica para pasear fallas.',
    commentEn: 'Historic centre and castle as backdrop; very photogenic for walking the fallas.',
  },
  {
    name: 'Paterna',
    commissionsEs: '18 comisiones',
    commissionsEn: '18 commissions',
    specialSectionEs: 'Sí, fallas "grandes" y clasificación en secciones.',
    specialSectionEn: 'Yes, "big" fallas and section classification.',
    transportEs: 'Metro líneas 1, 2 y 4 según barrio, 15–25 min; también Cercanías C3.',
    transportEn: 'Metro lines 1, 2 and 4 depending on area, 15–25 min; also Cercanías C3.',
    commentEs: 'Conocida por la Cordà en agosto; red fallera muy consolidada.',
    commentEn: 'Famous for the Cordà in August; very solid fallera network.',
  },
  {
    name: 'Sueca',
    commissionsEs: '16 comisiones',
    commissionsEn: '16 commissions',
    specialSectionEs: 'Sí, fallas de gran tradición y secciones altas.',
    specialSectionEn: 'Yes, fallas with strong tradition and high sections.',
    transportEs: 'Tren de Media Distancia hacia Gandia (parada Sueca) o bus interurbano desde València.',
    transportEn: 'Media Distancia train to Gandia (stop at Sueca) or intercity bus from València.',
    commentEs: 'Población arrocera con mucha tradición fallera y ambiente muy local.',
    commentEn: 'Rice-growing town with strong fallera tradition and very local vibe.',
  },
  {
    name: 'Cullera',
    commissionsEs: '16 comisiones',
    commissionsEn: '16 commissions',
    specialSectionEs: 'Sí, fallas destacadas y premios importantes.',
    specialSectionEn: 'Yes, standout fallas and major awards.',
    transportEs: 'Cercanías C1 (València Nord → Cullera), 35–45 min.',
    transportEn: 'Cercanías C1 (València Nord → Cullera), 35–45 min.',
    commentEs: 'Ideal para combinar mar, castillo y fallas en un solo día.',
    commentEn: 'Ideal for combining sea, castle and fallas in a single day.',
  },
  {
    name: 'Burriana',
    commissionsEs: '~15 comisiones',
    commissionsEn: '~15 commissions',
    specialSectionEs: 'Sí, secciones y premios locales propios (referente en Castellón).',
    specialSectionEn: 'Yes, its own sections and local awards (benchmark in Castellón).',
    transportEs: 'Cercanías C6 (València Nord → Burriana-Alquerías) + bus/taxi al casco.',
    transportEn: 'Cercanías C6 (València Nord → Burriana-Alquerías) + bus/taxi to town.',
    commentEs: 'Muy conocida en la provincia de Castellón por la calidad de sus monumentos.',
    commentEn: 'Well known in Castellón province for the quality of its monuments.',
  },
  {
    name: 'Dénia',
    commissionsEs: 'Alrededor de una decena de comisiones',
    commissionsEn: 'Around a dozen commissions',
    specialSectionEs: 'Sí, fallas de varias secciones y premios importantes.',
    specialSectionEn: 'Yes, fallas in several sections and important awards.',
    transportEs: 'Trenet FGV (línea 9 desde Benidorm) o buses directos desde València; no Cercanías directo.',
    transportEn: 'FGV Trenet (line 9 from Benidorm) or direct buses from València; no direct Cercanías.',
    commentEs: 'Fallas junto al mar y al castillo; ambiente más tranquilo si evitas días punta.',
    commentEn: 'Fallas by the sea and the castle; more relaxed if you avoid peak days.',
  },
];

export const FallasBeyondValenciaPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);
  const lang: Lang = language;

  return (
    <div className="space-y-8 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Fallas más allá de Valencia ciudad', 'Fallas beyond Valencia city')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Alzira, Gandia, Sagunto, Torrent y decenas de pueblos de la Comunitat Valenciana celebran sus propias fallas. Algunas compiten al mismo nivel que la capital. Aquí: Top 10 por número de comisiones y tipo de escapada.',
            'Alzira, Gandia, Sagunto, Torrent and dozens of towns in the Valencian Community celebrate their own fallas. Some rival the capital. Here: Top 10 by number of commissions and type of trip.'
          )}
        </p>
      </header>

      {/* Top 10 tabla / cards */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-terreta-dark">
          {t('Top 10 ciudades falleras (sin València)', 'Top 10 fallera cities (excluding València)')}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-terreta-border bg-terreta-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-terreta-border bg-terreta-bg/70">
                <th className="text-left py-3 px-3 font-semibold text-terreta-dark">
                  {t('Ciudad', 'City')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-terreta-dark">
                  {t('Comisiones', 'Commissions')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-terreta-dark">
                  {t('Sección especial', 'Special section')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-terreta-dark">
                  {t('Cómo llegar (TP público)', 'How to get there (public transport)')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-terreta-dark">
                  {t('Comentario útil', 'Useful comment')}
                </th>
              </tr>
            </thead>
            <tbody>
              {TOP_10_CITIES.map((city) => (
                <tr
                  key={city.name}
                  className="border-b border-terreta-border/70 last:border-b-0 hover:bg-terreta-bg/40 transition-colors"
                >
                  <td className="py-3 px-3 font-semibold text-terreta-dark">{city.name}</td>
                  <td className="py-3 px-3 text-terreta-dark">
                    {lang === 'es' ? city.commissionsEs : city.commissionsEn}
                  </td>
                  <td className="py-3 px-3 text-terreta-dark max-w-[180px]">
                    {lang === 'es' ? city.specialSectionEs : city.specialSectionEn}
                  </td>
                  <td className="py-3 px-3 text-terreta-secondary max-w-[220px]">
                    {lang === 'es' ? city.transportEs : city.transportEn}
                  </td>
                  <td className="py-3 px-3 text-terreta-dark max-w-[240px]">
                    {lang === 'es' ? city.commentEs : city.commentEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Datos curiosos: Alzira y Gandia */}
      <section className="rounded-xl border border-terreta-border bg-terreta-bg/50 p-4 md:p-5 space-y-4">
        <h3 className="text-lg font-semibold text-terreta-dark flex items-center gap-2">
          <Sparkles size={18} className="text-terreta-accent" />
          {t('Datos curiosos: Alzira y Gandia', 'Did you know: Alzira and Gandia')}
        </h3>
        <div className="space-y-3 text-sm text-terreta-dark leading-relaxed">
          <p>
            <span className="font-semibold">Alzira</span> —{' '}
            {t(
              'Sus Fallas están reconocidas como Fiesta de Interés Turístico Nacional. La ciudad impulsa proyectos como "Fallers pel Món", que exportan la plantà y la cremà a otras ciudades de España y del extranjero.',
              'Its Fallas are recognised as a Fiesta of National Tourist Interest. The city promotes projects like "Fallers pel Món", which export the plantà and cremà to other cities in Spain and abroad.'
            )}
          </p>
          <p>
            <span className="font-semibold">Gandia</span> —{' '}
            {t(
              'Las Fallas han aprobado un cambio "histórico" de organización interna a partir de 2027: una nueva clasificación en secciones basada en el censo fallero oficial (número de falleros adultos e infantiles), buscando un sistema más justo y sostenible.',
              'Fallas have approved a "historic" change in internal organisation from 2027: a new section classification based on the official fallero census (number of adult and child falleros), aiming for a fairer and more sustainable system.'
            )}
          </p>
        </div>
      </section>

      {/* Filtros rápidos: Metro, Escapada, Brisa marina */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-terreta-dark">
          {t('Por tipo de escapada', 'By type of trip')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-terreta-border bg-terreta-bg/50 p-4">
            <div className="flex items-center gap-2 text-terreta-accent mb-2">
              <Train size={18} />
              <span className="font-semibold text-terreta-dark text-sm">
                {t('A un paso del Metro', 'One step from the Metro')}
              </span>
            </div>
            <p className="text-xs text-terreta-secondary">
              Torrent, Paterna. {t('También cerca:', 'Also nearby:')} Burjassot, Mislata, Xirivella.
            </p>
          </div>
          <div className="rounded-xl border border-terreta-border bg-terreta-bg/50 p-4">
            <div className="flex items-center gap-2 text-terreta-accent mb-2">
              <MapPin size={18} />
              <span className="font-semibold text-terreta-dark text-sm">
                {t('Escapada de un día', 'Day trip')}
              </span>
            </div>
            <p className="text-xs text-terreta-secondary">
              Sagunto, Alzira, Xàtiva {t('(Cercanías C2/C6)', '(Cercanías C2/C6)')}.
            </p>
          </div>
          <div className="rounded-xl border border-terreta-border bg-terreta-bg/50 p-4">
            <div className="flex items-center gap-2 text-terreta-accent mb-2">
              <Sun size={18} />
              <span className="font-semibold text-terreta-dark text-sm">
                {t('Fallas con brisa marina', 'Fallas by the sea')}
              </span>
            </div>
            <p className="text-xs text-terreta-secondary">
              Gandia, Cullera, Dénia.
            </p>
          </div>
        </div>
      </section>

      {/* Mención Cartagena */}
      <section className="space-y-2 pt-2 border-t border-terreta-border">
        <h3 className="text-base font-semibold text-terreta-dark">
          {t('También en la costa', 'Also on the coast')}
        </h3>
        <p className="text-sm text-terreta-dark max-w-3xl leading-relaxed">
          <span className="font-semibold">Cartagena</span> —{' '}
          {t(
            'Incorporó las Fallas recientemente, mezclando tradición valenciana con su propia identidad mediterránea y un claro objetivo de atraer turismo primaveral.',
            'Recently adopted Fallas, mixing Valencian tradition with its own Mediterranean identity and a clear aim to attract spring tourism.'
          )}
        </p>
      </section>
    </div>
  );
};
