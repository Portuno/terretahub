import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface MentionUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface MentionState {
  isActive: boolean;
  query: string;
  position: { top: number; left: number } | null;
  selectedIndex: number;
}

export const useMentions = (
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>,
  value: string,
  onChange: (value: string) => void
) => {
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    query: '',
    position: null,
    selectedIndex: 0
  });
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const mentionStartRef = useRef<number | null>(null);

  // Buscar usuarios mientras se escribe
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, name, avatar')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) {
        console.error('Error al buscar usuarios:', error);
        setSuggestions([]);
        return;
      }

      // Formatear usuarios con avatar por defecto si no tienen
      const formattedUsers: MentionUser[] = (data || []).map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
      }));

      setSuggestions(formattedUsers);
    } catch (err) {
      console.error('Error al buscar usuarios:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Detectar cuando se escribe @
  const handleTextChange = useCallback((newValue: string, cursorPosition: number) => {
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    // Verificar si hay un @ seguido de texto sin espacios
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Si hay un espacio después del @, no es una mención
      if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        setMentionState(prev => ({ ...prev, isActive: false }));
        return;
      }

      // Es una mención potencial
      const query = textAfterAt.toLowerCase();
      
      // Obtener posición del cursor para mostrar sugerencias
      if (inputRef.current) {
        const input = inputRef.current;
        const coordinates = getCaretCoordinates(input, lastAtIndex);
        
        setMentionState({
          isActive: true,
          query,
          position: {
            top: coordinates.top + 20,
            left: coordinates.left
          },
          selectedIndex: 0
        });

        mentionStartRef.current = lastAtIndex;
        searchUsers(query);
      }
    } else {
      setMentionState(prev => ({ ...prev, isActive: false }));
      mentionStartRef.current = null;
    }
  }, [searchUsers, inputRef]);

  // Insertar mención en el texto
  const insertMention = useCallback((user: MentionUser) => {
    if (!inputRef.current || mentionStartRef.current === null) return;

    const input = inputRef.current;
    const start = mentionStartRef.current;
    const end = input.selectionStart || 0;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    
    // Insertar @username con un espacio después
    const newText = `${textBefore}@${user.username} ${textAfter}`;
    onChange(newText);

    // Restaurar cursor después del mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = start + user.username.length + 2; // @ + username + espacio
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);

    setMentionState(prev => ({ ...prev, isActive: false }));
    mentionStartRef.current = null;
  }, [value, onChange, inputRef]);

  // Navegar sugerencias con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!mentionState.isActive || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, suggestions.length - 1)
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0)
      }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[mentionState.selectedIndex]) {
        insertMention(suggestions[mentionState.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionState(prev => ({ ...prev, isActive: false }));
      mentionStartRef.current = null;
    }
  }, [mentionState, suggestions, insertMention]);

  return {
    mentionState,
    suggestions,
    loading,
    insertMention,
    handleTextChange,
    handleKeyDown
  };
};

// Helper para obtener coordenadas del cursor
function getCaretCoordinates(element: HTMLTextAreaElement | HTMLInputElement, position: number) {
  // Para inputs simples, usar un método más simple
  if (element instanceof HTMLInputElement) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingTop = parseInt(style.paddingTop) || 0;
    
    // Aproximación simple para inputs
    return {
      top: paddingTop,
      left: paddingLeft + (element.value.substring(0, position).length * 7) // Aproximación de ancho de carácter
    };
  }

  // Para textareas, usar el método completo
  const div = document.createElement('div');
  const style = getComputedStyle(element);
  
  // Copiar estilos
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border', 'boxSizing'].forEach(prop => {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  });
  
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.width = `${element.offsetWidth}px`;
  
  div.textContent = element.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  
  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  
  const coordinates = {
    top: spanRect.top - rect.top + element.scrollTop,
    left: spanRect.left - rect.left + element.scrollLeft
  };
  
  document.body.removeChild(div);
  
  return coordinates;
}
