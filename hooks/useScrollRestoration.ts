import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollRestoration = (elementId: string): void => {
  const location = useLocation();

  useEffect(() => {
    const node = document.getElementById(elementId);
    if (!node) return;
    const key = `terreta-scroll:${location.pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      node.scrollTop = Number(saved) || 0;
    } else {
      node.scrollTop = 0;
    }
    return () => {
      sessionStorage.setItem(key, String(node.scrollTop));
    };
  }, [elementId, location.pathname]);
};
