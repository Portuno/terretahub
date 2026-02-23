import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasTipsPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Consejos prácticos', 'Practical tips')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Qué comer, cómo vestirse y qué esperar del día a día durante Fallas. Esta sección recoge trucos que normalmente solo te cuenta alguien que ya ha pasado por su primera semana fallera.',
            'What to eat, how to dress and what to expect day to day during Fallas. This section gathers tips that usually only someone who has been through their first fallera week will tell you.'
          )}
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Normas y horarios útiles', 'Useful rules and schedules')}
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>
            {t(
              'Puestos de buñuelos: autorizados del 2 al 19 de marzo.',
              'Buñuelo stalls: authorised from 2 to 19 March.'
            )}
          </li>
          <li>
            {t(
              'Opciones para celíacos: se permite la elaboración de masas fritas aptas para celíacos con harinas certificadas "Sin Gluten", siempre que haya separación física en el puesto.',
              'Options for coeliacs: gluten-free fried dough is allowed with certified "Sin Gluten" flours, provided there is physical separation in the stall.'
            )}
          </li>
          <li>
            {t(
              'Baños públicos: las comisiones que organizan verbenas deben garantizar aseos portátiles abiertos al público las 24 horas.',
              'Public toilets: commissions that organise verbenas must provide portable toilets open to the public 24 hours.'
            )}
          </li>
          <li>
            {t(
              'Verbenas: los horarios autorizados son de 22:00 a 04:00 h (noches del 7, 14, 16, 17 y 18 de marzo).',
              'Verbenas: authorised hours are 22:00 to 04:00 (nights of 7, 14, 16, 17 and 18 March).'
            )}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Supervivencia básica', 'Basic survival')}
        </h3>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>
            {t(
              'Zapatillas cómodas y cerradas: vas a caminar mucho y el suelo está lleno de restos de petardos.',
              'Comfortable closed shoes: you will walk a lot and the ground is full of firecracker debris.'
            )}
          </li>
          <li>
            {t(
              'Capas de ropa: marzo en Valencia puede pasar de solazo a aire frío en cuestión de horas.',
              'Layered clothing: March in Valencia can go from blazing sun to cold air in a matter of hours.'
            )}
          </li>
          <li>
            {t(
              'No estrenes tu outfit favorito la noche de la Cremà: el olor a humo se queda varios lavados.',
              "Don't wear your favourite outfit on Cremà night: the smell of smoke lingers for several washes."
            )}
          </li>
          <li>
            {t(
              'Reserva para comer fuera en los días clave o abraza el plan bocadillo + buñuelos.',
              'Book to eat out on key days or embrace the sandwich + buñuelos plan.'
            )}
          </li>
        </ul>
      </section>
    </div>
  );
};

