import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Documentation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-terreta-bg py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-terreta-accent hover:text-terreta-dark transition-colors mb-4 text-sm font-semibold"
          >
            ← Volver
          </button>
          <h1 className="font-serif text-3xl md:text-4xl text-terreta-dark font-bold mb-2">
            Documentación
          </h1>
          <p className="text-sm text-terreta-dark/60">
            Guía completa sobre Terreta Hub
          </p>
        </div>

        {/* Content */}
        <div className="bg-terreta-card rounded-lg p-6 md:p-8 shadow-sm border border-terreta-border space-y-8">
          
          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              ¿Qué es Terreta Hub?
            </h2>
            <p className="text-terreta-dark/80 leading-relaxed">
              Terreta Hub es un laboratorio digital diseñado para conectar mentes creativas y fomentar la colaboración. 
              Es un espacio donde puedes experimentar, crear proyectos, compartir ideas y construir el futuro con sabor a Valencia.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              Funcionalidades Principales
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Ágora Comunitario</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  El Ágora es el corazón de la comunidad. Aquí puedes publicar posts, compartir ideas, 
                  hacer preguntas y conectar con otros miembros. Puedes mencionar a otros usuarios usando @username 
                  y compartir imágenes, videos y otros medios.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Proyectos</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Crea y comparte tus proyectos con la comunidad. Cada proyecto puede incluir imágenes, 
                  descripciones detalladas y enlaces. Los proyectos destacados aparecen en la galería principal.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Comunidad</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Explora los perfiles de otros miembros, descubre sus proyectos y conecta con personas 
                  que comparten tus intereses. Puedes filtrar y ordenar la comunidad por diferentes criterios.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Eventos</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Mantente al día con los próximos eventos de la comunidad. Los eventos pueden incluir 
                  información sobre ubicación, fecha, hora y descripción detallada.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Recursos y Colaboración</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Accede a una biblioteca de recursos compartidos por la comunidad y encuentra oportunidades 
                  de colaboración en proyectos.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              Cómo Empezar
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-terreta-dark/80 ml-4">
              <li className="leading-relaxed">
                <strong>Crea una cuenta:</strong> Haz clic en "Iniciar Sesión" y regístrate con tu email o cuenta de Google.
              </li>
              <li className="leading-relaxed">
                <strong>Completa tu perfil:</strong> Ve a tu perfil y añade información sobre ti, tu avatar y tus intereses.
              </li>
              <li className="leading-relaxed">
                <strong>Explora el Ágora:</strong> Visita el Ágora Comunitario para ver qué está pasando en la comunidad.
              </li>
              <li className="leading-relaxed">
                <strong>Crea tu primer proyecto:</strong> Comparte algo en lo que estés trabajando o algo que hayas completado.
              </li>
              <li className="leading-relaxed">
                <strong>Conecta con otros:</strong> Explora la comunidad y sigue a personas que te interesen.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              Características Avanzadas
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Menciones (@username)</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Puedes mencionar a otros usuarios en tus posts del Ágora usando @ seguido de su nombre de usuario. 
                  Los usuarios mencionados recibirán una notificación.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Medios en Posts</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Los posts del Ágora soportan imágenes, videos y otros tipos de medios. Puedes subir archivos 
                  directamente desde tu dispositivo.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Perfil Público</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Puedes hacer tu perfil público y compartir un enlace único que muestre tu biografía, 
                  proyectos y enlaces sociales.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">Notificaciones</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Recibirás notificaciones cuando alguien te mencione, comente en tus proyectos o 
                  interactúe con tu contenido.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">¿Es gratis usar Terreta Hub?</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Sí, Terreta Hub es completamente gratuito para todos los usuarios.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">¿Puedo eliminar mi cuenta?</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Sí, puedes eliminar tu cuenta en cualquier momento desde la configuración de tu perfil.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">¿Cómo reporto contenido inapropiado?</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Puedes usar el formulario de contacto o el sistema de feedback para reportar cualquier 
                  contenido que consideres inapropiado.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-terreta-dark mb-2">¿Puedo colaborar en proyectos de otros?</h3>
                <p className="text-terreta-dark/80 leading-relaxed">
                  Sí, puedes contactar a otros miembros a través de sus perfiles y proponer colaboraciones. 
                  También puedes buscar oportunidades en la sección de Recursos y Colaboración.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
              Soporte y Contacto
            </h2>
            <p className="text-terreta-dark/80 leading-relaxed mb-3">
              Si tienes preguntas, sugerencias o necesitas ayuda, puedes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
              <li>Usar el formulario de contacto disponible en la página principal</li>
              <li>Enviar feedback a través del botón de feedback en el dashboard</li>
              <li>Revisar nuestra Política de Privacidad y Términos y Condiciones</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};
