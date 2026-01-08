import React from 'react';
import { User } from 'lucide-react';

interface MentionUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface MentionSuggestionsProps {
  suggestions: MentionUser[];
  selectedIndex: number;
  position: { top: number; left: number } | null;
  onSelect: (user: MentionUser) => void;
  loading?: boolean;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  loading = false
}) => {
  if (!position || suggestions.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-terreta-card border border-terreta-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px'
      }}
    >
      {loading ? (
        <div className="p-3 text-sm text-terreta-secondary">Buscando...</div>
      ) : suggestions.length === 0 ? (
        <div className="p-3 text-sm text-terreta-secondary">No se encontraron usuarios</div>
      ) : (
        <div className="py-1">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-terreta-bg transition-colors ${
                index === selectedIndex ? 'bg-terreta-bg' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-terreta-border">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-terreta-sidebar flex items-center justify-center">
                    <User size={16} className="text-terreta-secondary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-terreta-dark truncate">{user.name}</div>
                <div className="text-xs text-terreta-secondary truncate">@{user.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
