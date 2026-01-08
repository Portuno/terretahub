import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
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
            Política de Privacidad
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
                1. Introducción
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                En Terreta Hub, nos comprometemos a proteger tu privacidad. Esta Política de Privacidad 
                explica cómo recopilamos, utilizamos, divulgamos y protegemos tu información personal 
                cuando utilizas nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                2. Información que Recopilamos
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                Recopilamos los siguientes tipos de información:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-terreta-dark mb-2">2.1. Información que nos proporcionas:</h3>
                  <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                    <li>Nombre y apellidos</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Nombre de usuario</li>
                    <li>Contenido que publiques (proyectos, posts, comentarios)</li>
                    <li>Información de perfil (avatar, biografía, enlaces)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-terreta-dark mb-2">2.2. Información recopilada automáticamente:</h3>
                  <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                    <li>Dirección IP</li>
                    <li>Tipo de navegador y dispositivo</li>
                    <li>Páginas visitadas y tiempo de permanencia</li>
                    <li>Datos de uso de la plataforma</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                3. Cómo Utilizamos tu Información
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en la plataforma</li>
                <li>Comunicarnos contigo sobre tu cuenta y nuestros servicios</li>
                <li>Enviar notificaciones sobre actividad en la plataforma</li>
                <li>Detectar y prevenir fraudes o abusos</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                4. Compartir Información
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                No vendemos tu información personal. Podemos compartir tu información en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Con tu consentimiento explícito</li>
                <li>Con proveedores de servicios que nos ayudan a operar la plataforma (bajo estrictos acuerdos de confidencialidad)</li>
                <li>Para cumplir con obligaciones legales o responder a solicitudes gubernamentales</li>
                <li>Para proteger nuestros derechos, privacidad, seguridad o propiedad</li>
                <li>En caso de fusión, adquisición o venta de activos (con previo aviso)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                5. Seguridad de los Datos
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información personal 
                contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión 
                por Internet o almacenamiento electrónico es 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                6. Tus Derechos
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed mb-3">
                De acuerdo con el Reglamento General de Protección de Datos (RGPD), tienes derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-terreta-dark/80 ml-4">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar datos inexactos o incompletos</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Oponerte al procesamiento de tus datos</li>
                <li>Solicitar la limitación del procesamiento</li>
                <li>Portabilidad de datos</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                7. Cookies y Tecnologías Similares
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso de la plataforma 
                y personalizar el contenido. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                8. Retención de Datos
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Conservamos tu información personal durante el tiempo necesario para cumplir con los propósitos descritos 
                en esta política, a menos que la ley requiera o permita un período de retención más largo.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                9. Menores de Edad
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Terreta Hub no está dirigido a menores de 16 años. No recopilamos intencionalmente información personal 
                de menores de 16 años. Si descubrimos que hemos recopilado información de un menor, tomaremos medidas 
                para eliminar esa información.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                10. Cambios a esta Política
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos 
                publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl text-terreta-dark font-bold mb-3">
                11. Contacto
              </h2>
              <p className="text-terreta-dark/80 leading-relaxed">
                Si tienes preguntas, preocupaciones o solicitudes relacionadas con esta Política de Privacidad o el tratamiento 
                de tus datos personales, puedes contactarnos a través del formulario de contacto disponible en la plataforma.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
