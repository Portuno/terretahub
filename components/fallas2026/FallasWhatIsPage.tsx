import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasWhatIsPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Qué es Fallas', 'What is Fallas')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Si eres nuevo en Valencia, Fallas (Les Falles en valenciano) es el gran festival de la ciudad y uno de los más intensos de Europa. Es arte efímero, pólvora, música y vida en la calle durante casi tres semanas.',
            'If you are new to Valencia, Fallas (Les Falles in Valencian) is the city’s biggest festival and one of the most intense in Europe. It is ephemeral art, gunpowder, music and street life for almost three weeks.'
          )}
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          {t(
            'A nivel práctico, Fallas consiste en que cientos de barrios construyen monumentos gigantescos —las fallas— que combinan sátira política, humor local y escenas fantásticas. Se plantan en la calle a mediados de marzo y se queman todas la noche del 19, en un ritual llamado la Cremà.',
            'In practice, Fallas means hundreds of neighbourhoods build huge monuments —the fallas— that mix political satire, local humour and fantasy scenes. They are erected in the street in mid-March and burned on the night of the 19th in a ritual called the Cremà.'
          )}
        </p>
        <p>
          {t(
            'Cada monumento nace de una comisión fallera, una asociación vecinal que pasa todo el año organizando loterías, cenas y eventos para pagar su falla. Las comisiones son el corazón social del festival: sin ellas no habría ninots, verbenas ni ofrenda de flores.',
            'Each monument comes from a fallera commission, a neighbourhood association that spends the whole year organising raffles, dinners and events to pay for their falla. The commissions are the social heart of the festival: without them there would be no ninots, verbenas or flower offering.'
          )}
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Lo que nadie te cuenta antes de tu primera Fallas', 'What nobody tells you before your first Fallas')}
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>
            {t(
              'Cerrar las ventanas no es opcional: a partir del 1 de marzo la ciudad suena y huele a pólvora.',
              'Closing the windows is not optional: from 1 March the city sounds and smells of gunpowder.'
            )}
          </li>
          <li>
            {t(
              'El sueño es negociable: entre despertàs, verbenas y petardos nocturnos, dormir del tirón es raro.',
              'Sleep is negotiable: with despertàs, verbenas and night firecrackers, sleeping through the night is rare.'
            )}
          </li>
          <li>
            {t(
              'Tu trayecto habitual se dobla: muchas calles se cierran y los desvíos son parte del juego.',
              'Your usual route doubles: many streets are closed and detours are part of the game.'
            )}
          </li>
          <li>
            {t(
              'Fallas no es solo el centro: en los barrios la fiesta es más manejable y a menudo más auténtica.',
              'Fallas is not just the centre: in the neighbourhoods the festival is more manageable and often more authentic.'
            )}
          </li>
        </ul>
      </section>
    </div>
  );
};
