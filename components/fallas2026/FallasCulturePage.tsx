import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasCulturePage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Cultura, exposiciones y monumentos', 'Culture, exhibitions and monuments')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Fallas es también un museo al aire libre: Exposición del Ninot, Museo Fallero y cientos de monumentos repartidos por toda la ciudad, muchos con presupuestos de seis cifras.',
            'Fallas is also an open-air museum: Ninot Exhibition, Fallero Museum and hundreds of monuments across the city, many with six-figure budgets.'
          )}
        </p>
      </header>

      {/* Eventos principales */}
      <section className="space-y-4 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <div className="space-y-4">
          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Exposición del Ninot', 'The Ninot Exhibition')}
            </h4>
            <p>
              {t(
                'La Exposición del Ninot se celebra desde comienzos de febrero hasta el 15 de marzo. Los ninots son las figuras que forman las escenas de los monumentos falleros. Cada comisión expone su mejor ninot en una muestra hasta el día de la plantà, momento en que cada figura es recogida por su comisión y llevada a su monumento. Las personas visitantes pueden votar por su ninot favorito y el que recibe más votos será indultado: no se quemará la noche del 19 de marzo y pasará a formar parte de la colección del Museo Fallero.',
                'The Ninot Exhibition is held from the beginning of February until 15 March. Ninots are the figures that form the scenes of the Fallas monuments. Each commission displays its best ninot in the exhibition until the day of the plantà, when every figure is collected and taken to its monument. Visitors can vote for their favourite ninot and the one that receives the most votes will be pardoned. It will not be burnt on 19 March and will become part of the collection at the Fallas Museum.'
              )}
            </p>
          </article>

          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('La Crida', 'The Crida')}
            </h4>
            <p>
              {t(
                'La Crida es el acto que inaugura oficialmente las Fallas. El día empieza con un bombardeo pirotécnico y un desayuno fallero, seguido de la entrada de bandas de música y una mascletà en la Plaza del Ayuntamiento. Por la tarde, desde las Torres de Serranos y tras un espectáculo de luces, sonido, música y pirotecnia, la Fallera Mayor de València, acompañada por su Corte de Honor y las autoridades de la ciudad, invita al mundo entero a disfrutar de la fiesta.',
                'The Crida is the official opening ceremony of Fallas. The day begins with a barrage of fireworks and a typical Fallas breakfast, followed by marching bands and a mascletà in City Hall Square. In the afternoon, from the Serranos Towers and after a spectacular show of light, sound, music and pyrotechnics, the Fallas Queen of Valencia, accompanied by her Court of Honour and the city authorities, invites the whole world to enjoy the festival.'
              )}
            </p>
          </article>

          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Las mascletàs', 'The mascletàs')}
            </h4>
            <p>
              {t(
                'Del 1 al 19 de marzo, miles de personas se reúnen cada día a las 14:00 en la Plaza del Ayuntamiento para vivir la mascletà, un espectáculo pirotécnico de entre 5 y 7 minutos con un ritmo muy definido, en el que las explosiones de pólvora van creciendo hasta un final atronador.',
                'From 1 to 19 March, thousands of people gather every day at 14:00 in City Hall Square to experience the mascletà, a pyrotechnic show lasting between 5 and 7 minutes, with a very defined rhythm in which the explosions gradually intensify until an overwhelming finale.'
              )}
            </p>
          </article>

          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('La plantà', 'The plantà')}
            </h4>
            <p>
              {t(
                'El 15 de marzo los artistas falleros dejan los monumentos completamente terminados y preparados para ser visitados en la calle, con todos sus ninots, carteles y detalles. Marca el inicio de la gran semana fallera y convierte València en un museo de arte efímero al aire libre.',
                'On 15 March, the Fallas artists leave the monuments completely finished and ready to be visited in the streets, with all their ninots, posters and details. This marks the start of the main Fallas week and turns Valencia into a temporary open-air art museum.'
              )}
            </p>
          </article>
        </div>
      </section>

      {/* Fuegos y tradiciones */}
      <section className="space-y-4 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <div className="space-y-4">
          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Castillos de fuegos artificiales', 'Fireworks displays')}
            </h4>
            <p>
              {t(
                'El primero, conocido como Nit de l’Alba, reúne a cientos de comisiones falleras que disparan castillos de fuegos de manera sincronizada a medianoche del día 15. Del 16 al 18 de marzo se lanzan castillos en los Jardines del Turia, entre los puentes de la Exposición y de las Flores. El más espectacular es la Nit del Foc, en la noche del 18 al 19, preludio del día grande de las Fallas.',
                'The first, known as the Nit de l’Alba, brings together the synchronised fireworks displays of hundreds of Fallas commissions at midnight on the 15th. From the 16th to the 18th there are firework displays in the Turia Gardens, between the “Exposición” and “Las Flores” bridges. The most spectacular is the Nit del Foc (Night of Fire), held on the night of the 18th to the 19th as a prelude to the main day of Fallas.'
              )}
            </p>
          </article>

          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('La Ofrenda de Flores', 'The flower offering')}
            </h4>
            <p>
              {t(
                'Los días 17 y 18 de marzo se celebra la Ofrenda de Flores a la Virgen de los Desamparados, patrona de València. Todas las comisiones se visten con sus mejores trajes para ofrecer ramos de flores a una gran imagen de la Virgen situada en el centro de la plaza que lleva su nombre, donde se encuentra también su Basílica.',
                'On 17 and 18 March, a flower offering is made to the Virgen de los Desamparados (Our Lady of the Forsaken), the patron saint of Valencia. All the commissions wear their finest traditional dress to offer bouquets of flowers to a huge statue of the Virgin in the square that bears her name, where her Basilica is also located.'
              )}
            </p>
          </article>

          <article className="space-y-2">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('La Cremà', 'The cremà')}
            </h4>
            <p>
              {t(
                'La Cremà es el acto más conocido internacionalmente y el que da sentido a toda la fiesta. Todos los monumentos falleros, que han estado expuestos en la calle, se queman en la madrugada del 19 al 20 de marzo. Es el final del festival y resume toda su grandeza.',
                'The cremà is the most internationally renowned event and gives meaning to the whole festival. All the Fallas monuments that have been on display in the streets are burnt in the early hours of 19 to 20 March. It is the grand finale of the festival and represents all of its splendour.'
              )}
            </p>
          </article>
        </div>
      </section>

      {/* Descubrir las Fallas durante el año */}
      <section className="space-y-4 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p className="text-terreta-secondary">
          {t(
            'Si visitas València fuera de los días grandes de marzo, todavía puedes sumergirte en el mundo fallero visitando museos y espacios clave vinculados a la fiesta.',
            'If you visit Valencia outside the main days in March, you can still immerse yourself in the world of Fallas by visiting key museums and spaces linked to the festival.'
          )}
        </p>

        <ul className="space-y-4">
          <li className="rounded-xl border border-terreta-border bg-terreta-bg/60 p-4 md:p-5 shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Museo Fallero', 'Fallas Museum')}
            </h4>
            <p className="mt-1 text-terreta-dark">
              {t(
                'Aquí se conserva la colección formada por los ninots ganadores que, desde 1934, se han salvado del fuego por votación popular. También encontrarás carteles y fotografías de Fallas.',
                'Here you can see the collection of winning ninots which, since 1934, have been saved from the fire by popular vote, as well as Fallas posters and photographs.'
              )}
            </p>
            <dl className="mt-3 space-y-1 text-xs md:text-sm text-terreta-secondary">
              <div className="flex gap-1">
                <dt className="font-semibold">{t('📍 Dirección:', '📍 Address:')}</dt>
                <dd>Plaza de Monteolivete, 4</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('⏰ Horario:', '⏰ Hours:')}</dt>
                <dd>
                  {t(
                    'De lunes a sábado: de 9:30 a 19:00. Domingos y festivos: de 9:30 a 15:00.',
                    'Monday to Saturday: 9:30–19:00. Sundays and public holidays: 9:30–15:00.'
                  )}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('€ Precio:', '€ Price:')}</dt>
                <dd>
                  {t(
                    'Entrada general: 2 €. Entrada gratuita los domingos y festivos. Gratis con la Valencia Tourist Card.',
                    'Single entry: €2. Free entry on Sundays and public holidays. Free with the Valencia Tourist Card.'
                  )}
                </dd>
              </div>
            </dl>
          </li>

          <li className="rounded-xl border border-terreta-border bg-terreta-bg/60 p-4 md:p-5 shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Museo del Gremio de Artistas Falleros', 'Museum of the Guild of Fallas Artists')}
            </h4>
            <p className="mt-1 text-terreta-dark">
              {t(
                'Reúne una amplia selección de las obras realizadas por las personas miembros del Gremio, tanto en el ámbito profesional fallero como en otros campos creativos.',
                'It contains an extensive selection of work carried out by guild members, both in the professional Fallas field and in other creative disciplines.'
              )}
            </p>
            <dl className="mt-3 space-y-1 text-xs md:text-sm text-terreta-secondary">
              <div className="flex gap-1">
                <dt className="font-semibold">{t('📍 Dirección:', '📍 Address:')}</dt>
                <dd>Av. San José Artesano, 17</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('⏰ Horario:', '⏰ Hours:')}</dt>
                <dd>
                  {t(
                    'De lunes a viernes: de 10:00 a 14:00 y de 16:00 a 19:00. Sábados de 10:00 a 14:00. Cerrado domingos, festivos y agosto.',
                    'Monday to Friday: 10:00–14:00 and 16:00–19:00. Saturdays: 10:00–14:00. Closed on Sundays, public holidays and in August.'
                  )}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('€ Precio:', '€ Price:')}</dt>
                <dd>
                  {t(
                    'Entrada: 4 €. Entrada reducida: 2,5 €. 10% de descuento con la Valencia Tourist Card.',
                    'Entry: €4. Reduced: €2.5. 10% discount with the Valencia Tourist Card.'
                  )}
                </dd>
              </div>
            </dl>
          </li>

          <li className="rounded-xl border border-terreta-border bg-terreta-bg/60 p-4 md:p-5 shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('Museo de la Seda', 'Silk Museum')}
            </h4>
            <p className="mt-1 text-terreta-dark">
              {t(
                'Descubre cómo llegó la seda a València, la importancia de este oficio durante más de tres siglos y el legado que todavía hoy se aprecia en la indumentaria tradicional de las fiestas.',
                'Discover how silk came to Valencia, the importance of this trade for more than three centuries and the legacy that can still be seen today in the traditional dress worn at Valencia’s festivals.'
              )}
            </p>
            <dl className="mt-3 space-y-1 text-xs md:text-sm text-terreta-secondary">
              <div className="flex gap-1">
                <dt className="font-semibold">{t('📍 Dirección:', '📍 Address:')}</dt>
                <dd>Calle Hospital, 7</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('⏰ Horario:', '⏰ Hours:')}</dt>
                <dd>
                  {t(
                    'Lunes y domingos: de 10:00 a 15:00. De martes a sábado: de 10:00 a 19:00.',
                    'Mondays and Sundays: 10:00–15:00. Tuesday to Saturday: 10:00–19:00.'
                  )}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('€ Precio:', '€ Price:')}</dt>
                <dd>
                  {t(
                    'Entrada: 6 €. Reducida: 5 €. 50% de descuento y 5% en la tienda del museo con la Valencia Tourist Card.',
                    'Entry: €6. Reduced: €5. 50% discount and 5% off in the museum shop with the Valencia Tourist Card.'
                  )}
                </dd>
              </div>
            </dl>
          </li>

          <li className="rounded-xl border border-terreta-border bg-terreta-bg/60 p-4 md:p-5 shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-terreta-dark">
              {t('El balcón del Ayuntamiento de València', 'The balcony of Valencia City Hall')}
            </h4>
            <p className="mt-1 text-terreta-dark">
              {t(
                'Hazte una foto en el balcón del Ayuntamiento de València desde el que, cada día del 1 al 19 de marzo, la Fallera Mayor anuncia el inicio de la mascletà con la frase: "Senyor pirotècnic, pot començar la mascletà".',
                'Take a selfie on the balcony of Valencia City Hall, where every day from 1 to 19 March the Fallas Queen announces the start of the mascletà with the phrase: “Senyor pirotècnic, pot començar la mascletà”.'
              )}
            </p>
            <dl className="mt-3 space-y-1 text-xs md:text-sm text-terreta-secondary">
              <div className="flex gap-1">
                <dt className="font-semibold">{t('📍 Dirección:', '📍 Address:')}</dt>
                <dd>Plaza del Ayuntamiento, 1</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('⏰ Horario:', '⏰ Hours:')}</dt>
                <dd>
                  {t(
                    'De lunes a viernes de 9:00 a 15:00.',
                    'Monday to Friday: 9:00–15:00.'
                  )}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-semibold">{t('€ Precio:', '€ Price:')}</dt>
                <dd>{t('Entrada gratuita.', 'Free entry.')}</dd>
              </div>
            </dl>
          </li>
        </ul>
      </section>
    </div>
  );
};
