import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../../types';
import { BottomSheet } from './BottomSheet';
import { GuideChat } from './GuideChat';

interface CreateSheetProps {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const CreateSheet: React.FC<CreateSheetProps> = ({ open, user, onClose, onOpenAuth }) => {
  const navigate = useNavigate();

  const go = (path: string) => {
    onClose();
    if (!user) {
      onOpenAuth();
      return;
    }
    navigate(path);
  };

  return (
    <BottomSheet open={open} title="Guía" onClose={onClose}>
      {user ? (
        <GuideChat user={user} onOpenAuth={onOpenAuth} />
      ) : (
        <div className="space-y-3">
          <p className="text-m-base text-terreta-dark">Podés mirar la ciudad sin cuenta. Para publicar, creá tu perfil.</p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="h-11 w-full rounded-shell bg-terreta-accent text-m-base font-semibold text-white"
          >
            Crear perfil
          </button>
        </div>
      )}
      <div className="mt-4 grid gap-2 border-t border-terreta-border pt-3">
        <button type="button" onClick={() => go('/agora')} className="text-left text-m-sm text-terreta-dark">
          Publicar en el Ágora
        </button>
        <button type="button" onClick={() => go('/eventos?crear=1')} className="text-left text-m-sm text-terreta-dark">
          Crear quedada en el formulario
        </button>
        <button type="button" onClick={() => go('/proyectos?crear=1')} className="text-left text-m-sm text-terreta-dark">
          Crear proyecto en el formulario
        </button>
      </div>
    </BottomSheet>
  );
};
