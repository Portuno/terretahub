import React from 'react';
import { X, Twitter, Facebook, Instagram, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
  postContent: string;
  authorName: string;
  authorHandle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postUrl,
  postContent,
  authorName,
  authorHandle
}) => {
  if (!isOpen) return null;

  const siteUrl = window.location.origin;
  const fullPostUrl = `${siteUrl}${postUrl}`;
  
  // Truncar contenido para compartir (máximo 280 caracteres para Twitter)
  const truncatedContent = postContent.length > 200 
    ? `${postContent.substring(0, 200)}...` 
    : postContent;
  
  const shareText = `${truncatedContent} - ${authorName} ${authorHandle} en Terreta Hub`;

  // URLs de compartir
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullPostUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullPostUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullPostUrl)}`;
  // Instagram Stories usa un esquema especial que abre la app
  const instagramStoryUrl = `https://www.instagram.com/create/story/?media=${encodeURIComponent(fullPostUrl)}`;

  const handleShare = (url: string, platform: string) => {
    if (platform === 'instagram') {
      // Para Instagram Stories, copiamos el enlace al portapapeles
      // Instagram no tiene una URL directa para compartir desde web
      navigator.clipboard.writeText(fullPostUrl).then(() => {
        // Intentar abrir Instagram en móvil si es posible
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          // Intentar abrir Instagram app
          window.location.href = 'instagram://create/story';
        } else {
          // En desktop, solo copiar el enlace
          alert('Enlace copiado al portapapeles. Pégalo en tu Instagram Story o comparte la imagen directamente desde la app de Instagram.');
        }
      }).catch(() => {
        // Fallback: mostrar el enlace para copiar manualmente
        const linkInput = document.createElement('input');
        linkInput.value = fullPostUrl;
        document.body.appendChild(linkInput);
        linkInput.select();
        try {
          document.execCommand('copy');
          alert('Enlace copiado. Pégalo en tu Instagram Story.');
        } catch (err) {
          alert('Por favor, copia manualmente el enlace: ' + fullPostUrl);
        }
        document.body.removeChild(linkInput);
      });
    } else if (platform === 'whatsapp') {
      // WhatsApp se abre directamente en la app o web
      window.open(url, '_blank');
    } else {
      // Abrir en nueva ventana
      window.open(url, '_blank', 'width=600,height=400');
    }
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPostUrl).then(() => {
      alert('Enlace copiado al portapapeles');
      onClose();
    }).catch(() => {
      alert('Error al copiar el enlace');
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-terreta-card rounded-xl shadow-lg border border-terreta-border max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-terreta-dark">Compartir post</h2>
          <button
            onClick={onClose}
            className="text-terreta-secondary hover:text-terreta-dark transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleShare(whatsappUrl, 'whatsapp')}
            className="w-full flex items-center gap-3 p-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg transition-colors font-medium"
          >
            <MessageCircle size={24} />
            <span>Compartir en WhatsApp</span>
          </button>

          <button
            onClick={() => handleShare(twitterUrl, 'twitter')}
            className="w-full flex items-center gap-3 p-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors font-medium"
          >
            <Twitter size={24} />
            <span>Compartir en Twitter</span>
          </button>

          <button
            onClick={() => handleShare(facebookUrl, 'facebook')}
            className="w-full flex items-center gap-3 p-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-colors font-medium"
          >
            <Facebook size={24} />
            <span>Compartir en Facebook</span>
          </button>

          <button
            onClick={() => handleShare(instagramStoryUrl, 'instagram')}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white rounded-lg transition-opacity font-medium"
          >
            <Instagram size={24} />
            <span>Compartir en Instagram Story</span>
          </button>

          <div className="border-t border-terreta-border pt-3 mt-3">
            <button
              onClick={handleCopyLink}
              className="w-full p-3 bg-terreta-bg hover:bg-terreta-sidebar text-terreta-dark rounded-lg transition-colors font-medium border border-terreta-border"
            >
              Copiar enlace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
