import React, { useState } from 'react';
import { X, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface PublishProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (extension: string) => Promise<void>;
  currentExtension?: string;
}

export const PublishProfileModal: React.FC<PublishProfileModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  currentExtension
}) => {
  const [extension, setExtension] = useState(currentExtension || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar extensión - permitir letras, números, guiones y guiones bajos
    const cleanExtension = extension.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (!cleanExtension) {
      setError('La extensión no puede estar vacía');
      return;
    }

    if (cleanExtension.length < 3) {
      setError('La extensión debe tener al menos 3 caracteres');
      return;
    }

    if (cleanExtension.length > 50) {
      setError('La extensión no puede tener más de 50 caracteres');
      return;
    }

    setLoading(true);
    try {
      await onPublish(cleanExtension);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al publicar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir letras, números, guiones y guiones bajos
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setExtension(value);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in" ref={dialogRef}>
      <div className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#F9F6F0] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="publish-profile-title">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-terreta-dark/40 hover:text-terreta-dark p-1 z-10"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#D97706] rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe size={32} className="text-white" />
            </div>
            <h2 id="publish-profile-title" className="font-serif text-3xl text-terreta-dark mb-2">
              Publicar tu Perfil
            </h2>
            <p className="text-sm text-gray-500 font-sans">
              Elige una extensión personalizada para tu perfil público
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                Tu URL Personalizada
              </label>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
                <span className="text-sm text-gray-600 font-mono whitespace-nowrap">
                  www.terretahub.com/p/
                </span>
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={extension}
                    onChange={handleExtensionChange}
                    placeholder="tu-extension"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-terreta-dark placeholder-gray-400"
                    maxLength={50}
                    pattern="[a-z0-9_-]+"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
              <p className="text-sm text-blue-800">
                Una vez publicado, tu perfil será accesible públicamente en esta URL. 
                Podrás editarlo y actualizarlo cuando quieras.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !extension.trim()}
                className="flex-1 py-3 bg-[#D97706] text-white font-bold rounded-lg hover:bg-[#B45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Publicando...' : (
                  <>
                    <Globe size={18} />
                    Publicar Perfil
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

