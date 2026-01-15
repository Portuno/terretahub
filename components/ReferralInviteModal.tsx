import React, { useState } from 'react';
import { X, Copy, Link as LinkIcon, Users } from 'lucide-react';

interface ReferralInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink: string;
  referralCode: string;
}

export const ReferralInviteModal: React.FC<ReferralInviteModalProps> = ({ isOpen, onClose, referralLink, referralCode }) => {
  const [copyStatus, setCopyStatus] = useState('');

  if (!isOpen) return null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copiado`);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      console.error('[ReferralInviteModal] Copy failed:', err);
      setCopyStatus('No se pudo copiar');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className="relative w-full max-w-lg bg-terreta-card border border-terreta-border rounded-2xl shadow-2xl p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Invitar a la comunidad"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-terreta-secondary hover:text-terreta-dark transition-colors"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-terreta-accent/10 flex items-center justify-center text-terreta-accent">
            <Users size={18} />
          </div>
          <div>
            <h3 className="font-serif text-xl text-terreta-dark">Invita a tu comunidad</h3>
            <p className="text-sm text-terreta-secondary">Comparte tu link y suma nuevos miembros.</p>
          </div>
        </div>

        {copyStatus && (
          <p className="text-xs text-terreta-accent font-bold mb-3">{copyStatus}</p>
        )}

        <div className="space-y-4">
          <div className="bg-terreta-bg/60 border border-terreta-border rounded-xl p-4">
            <p className="text-xs font-bold text-terreta-secondary uppercase">Código de referido</p>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-terreta-dark font-bold text-lg">@{referralCode}</span>
              <button
                type="button"
                onClick={() => handleCopy(referralCode, 'Código')}
                className="flex items-center gap-2 text-xs font-bold text-terreta-accent hover:text-terreta-dark transition-colors"
                aria-label="Copiar código de referido"
              >
                <Copy size={14} />
                Copiar
              </button>
            </div>
          </div>

          <div className="bg-terreta-bg/60 border border-terreta-border rounded-xl p-4">
            <p className="text-xs font-bold text-terreta-secondary uppercase">Link de invitación</p>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-xs text-terreta-dark truncate">{referralLink}</span>
              <button
                type="button"
                onClick={() => handleCopy(referralLink, 'Link')}
                className="flex items-center gap-2 text-xs font-bold text-terreta-accent hover:text-terreta-dark transition-colors"
                aria-label="Copiar link de invitación"
              >
                <LinkIcon size={14} />
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
