import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsAndConditions: React.FC = () => {
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
            Términos y Condiciones
          </h1>
          <p className="text-sm text-terreta-dark/60">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-terreta-card rounded-lg p-6 md:p-8 shadow-sm border border-terreta-border">
          <div className="prose prose-sm max-w-none text-terreta-dark space-y-6">
            
            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                1. Aceptación de los Términos
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Al acceder y utilizar Terreta Hub, aceptas cumplir con estos Términos y Condiciones. 
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                2. Uso de la Plataforma
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                Terreta Hub es un laboratorio digital donde los usuarios pueden:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Crear y compartir proyectos</li>
                <li>Conectar con otros miembros de la comunidad</li>
                <li>Participar en el Ágora Comunitario</li>
                <li>Compartir recursos y colaborar</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                3. Cuentas de Usuario
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                Para utilizar ciertas funcionalidades de Terreta Hub, debes crear una cuenta. Eres responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Todas las actividades que ocurran bajo tu cuenta</li>
                <li>Proporcionar información precisa y actualizada</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                4. Contenido del Usuario
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Conservas todos los derechos sobre el contenido que publiques en Terreta Hub. 
                Al publicar contenido, nos otorgas una licencia no exclusiva para mostrar, 
                distribuir y modificar dicho contenido dentro de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                5. Conducta Prohibida
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                No está permitido:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Publicar contenido ofensivo, ilegal o que viole derechos de terceros</li>
                <li>Suplantar la identidad de otra persona</li>
                <li>Intentar acceder a áreas restringidas de la plataforma</li>
                <li>Utilizar la plataforma para fines comerciales no autorizados</li>
                <li>Interferir con el funcionamiento normal de Terreta Hub</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                6. Propiedad Intelectual
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Todos los derechos de propiedad intelectual sobre la plataforma Terreta Hub, 
                incluyendo diseño, código y marca, son propiedad de Terreta Hub o sus licenciantes.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                7. Limitación de Responsabilidad
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Terreta Hub se proporciona "tal cual" sin garantías de ningún tipo. 
                No nos hacemos responsables de daños directos, indirectos, incidentales o consecuentes 
                derivados del uso de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                8. Modificaciones
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor al ser publicadas en la plataforma. 
                Es tu responsabilidad revisar periódicamente estos términos.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                9. Terminación
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Podemos suspender o terminar tu acceso a Terreta Hub en cualquier momento, 
                con o sin causa, con o sin previo aviso, por cualquier motivo, 
                incluyendo la violación de estos Términos y Condiciones.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                10. Ley Aplicable
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Estos Términos y Condiciones se rigen por las leyes de España. 
                Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de Valencia.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                11. Contacto
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos 
                a través del formulario de contacto disponible en la plataforma.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
