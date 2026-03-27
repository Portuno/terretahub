import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Loader2, Send, Sparkles, X } from 'lucide-react';

type ChatMessage = { role: 'user' | 'model'; text: string };

const CHAT_API = '/api/chat/gemini';

interface ManualGuideChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const markdownComponents = {
  a: ({ href, children, ...props }: any) => {
    if (!href) return <a href={href} {...props}>{children}</a>;
    return href.startsWith('/') ? (
      <Link to={href} className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-90 transition-opacity" {...props}>
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-90"
        {...props}
      >
        {children}
      </a>
    );
  },
};

export const ManualGuideChatbot: React.FC<ManualGuideChatbotProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  const hasSentInitialPromptRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInput('');
      setError(null);

      const userMessage: ChatMessage = { role: 'user', text: trimmed };
      const nextMessages = [...messagesRef.current, userMessage];

      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const response = await fetch(CHAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
            context: 'manual',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'No se pudo conectar a la guia.');
          setMessages((prev) => [
            ...prev,
            { role: 'model', text: 'No pude responder ahora. Intenta de nuevo.' },
          ]);
          return;
        }

        setMessages((prev) => [...prev, { role: 'model', text: data.text ?? '' }]);
      } catch {
        setError('Error de red.');
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Algo fallo. Comprueba tu conexion e intentelo de nuevo.' },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading],
  );

  // Auto-disparo del prompt inicial cuando se abre el drawer.
  useEffect(() => {
    if (!isOpen) return;
    if (!initialPrompt) return;
    if (hasSentInitialPromptRef.current) return;

    hasSentInitialPromptRef.current = true;
    setMessages([{ role: 'user', text: initialPrompt }]);

    // Enviar sin esperar a que el estado se actualice (usamos mensajesRef).
    // En este punto messagesRef todavía puede no incluir el estado nuevo,
    // por eso hacemos el send con el texto inicial directamente.
    void sendMessage(initialPrompt);
  }, [initialPrompt, isOpen, sendMessage]);

  // Reset por apertura/cierre para permitir repetir desde otro articulo.
  useEffect(() => {
    if (isOpen) return;
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setError(null);
    hasSentInitialPromptRef.current = false;
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await sendMessage(input);
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const quickHint = useMemo(() => {
    if (!initialPrompt) return 'Pregunta lo que necesites sobre este manual.';
    return 'Ya tengo el contexto del articulo. Puedes pedir mejoras, plan o adaptaciones.';
  }, [initialPrompt]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:p-4"
      role="dialog"
      aria-label="Preguntar a nuestra guia"
    >
      <div className="w-full max-w-[720px] bg-terreta-bg/90 backdrop-blur-sm border border-terreta-border rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-terreta-border bg-terreta-card/90 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={18} className="text-terreta-accent" aria-hidden />
            <span className="text-sm font-semibold text-terreta-dark truncate">
              Nuestra guia (Manual)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-terreta-dark hover:bg-terreta-bg focus:outline-none focus:ring-2 focus:ring-terreta-accent"
            aria-label="Cerrar guia"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto py-4 px-4 min-h-0">
            {messages.length === 0 ? (
              <div className="max-w-lg mx-auto text-center">
                <p className="font-serif text-terreta-dark font-semibold text-lg mb-1">
                  Manual wiki
                </p>
                <p className="text-terreta-dark/70 text-sm mb-5">{quickHint}</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl mx-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-terreta-card border border-terreta-border flex items-center justify-center">
                      {msg.role === 'user' ? (
                        <span className="text-terreta-dark/60 text-xs font-bold" aria-hidden>
                          U
                        </span>
                      ) : (
                        <span className="text-terreta-accent text-sm font-serif" aria-hidden>
                          T
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-terreta-accent text-white'
                          : 'bg-terreta-card border border-terreta-border text-terreta-dark'
                      }`}
                    >
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm max-w-none text-sm text-terreta-dark [&_p]:my-1 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_a]:text-terreta-accent [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-80 [&_a]:transition-opacity">
                          <ReactMarkdown components={markdownComponents as any}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading ? (
                  <div className="flex gap-2.5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-terreta-card border border-terreta-border flex items-center justify-center">
                      <span className="text-terreta-accent text-sm font-serif" aria-hidden>
                        T
                      </span>
                    </div>
                    <div className="bg-terreta-card border border-terreta-border rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-terreta-accent" aria-hidden />
                      <span className="text-terreta-dark text-sm">Pensando…</span>
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {error ? (
            <div className="px-4 py-2 bg-red-50/30 border-t border-red-200">
              <p className="text-red-600 text-xs" role="alert">
                {error}
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-terreta-border bg-terreta-card/50">
            <div className="flex gap-2 items-end border border-terreta-border rounded-xl bg-terreta-bg focus-within:ring-2 focus-within:ring-terreta-accent/50 focus-within:border-terreta-accent transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre este manual…"
                rows={1}
                className="flex-1 min-h-[40px] max-h-24 resize-none bg-transparent px-3.5 py-2.5 text-terreta-dark placeholder:text-terreta-dark/50 focus:outline-none text-sm"
                disabled={isLoading}
                aria-label="Mensaje a la guia del manual"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 text-terreta-accent hover:bg-terreta-accent/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-xl transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

