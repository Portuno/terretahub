import React, { useCallback, useState } from 'react';
import { Copy } from 'lucide-react';

interface CopyMarkdownButtonProps {
  markdown: string;
  className?: string;
  ariaLabel?: string;
}

export const CopyMarkdownButton: React.FC<CopyMarkdownButtonProps> = ({
  markdown,
  className = '',
  ariaLabel = 'Copiar en Markdown',
}) => {
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus('Copiado');
      window.setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('No se pudo copiar');
      window.setTimeout(() => setCopyStatus(''), 2500);
    }
  }, [markdown]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terreta-bg border border-terreta-border text-terreta-secondary hover:bg-terreta-sidebar hover:text-terreta-dark transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
        aria-label={ariaLabel}
      >
        <Copy size={18} aria-hidden />
        <span className="font-semibold">Copiar en Markdown</span>
      </button>
      {copyStatus ? (
        <span className="text-xs font-bold text-terreta-accent" role="status" aria-live="polite">
          {copyStatus}
        </span>
      ) : null}
    </div>
  );
};

