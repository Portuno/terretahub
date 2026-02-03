import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TERRE_MASCOT_ANIMATION } from '../lib/mascotConstants';
import type { AuthUser } from '../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface HomeChatbotProps {
  user: AuthUser | null;
  onBack: () => void;
}

const CHAT_API = '/api/chat/gemini';

const QUICK_QUESTIONS = [
  '¿Qué es Terreta Hub?',
  '¿Qué proyectos hay?',
  '¿Qué eventos hay?',
  '¿Cómo puedo participar?',
];

const MASCOT_IMAGE = TERRE_MASCOT_ANIMATION.items[0]?.image
  || TERRE_MASCOT_ANIMATION.items[0]?.transparent_image
  || '';

export const HomeChatbot: React.FC<HomeChatbotProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Error al conectar con el asistente.');
        setMessages((prev) => [...prev, { role: 'model', text: 'No pude responder ahora. ¿Puedes intentar de nuevo?' }]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'model', text: data.text ?? '' }]);
    } catch {
      setError('Error de red.');
      setMessages((prev) => [...prev, { role: 'model', text: 'Algo falló. Comprueba la conexión e inténtalo de nuevo.' }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleQuickClick = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)] animate-fade-in">
      {/* Card superpuesta: resalta sobre el fondo */}
      <div className="flex flex-col flex-1 min-h-0 bg-terreta-card border border-terreta-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-terreta-border bg-terreta-sidebar/50 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-terreta-dark hover:text-terreta-accent font-sans font-bold tracking-wider uppercase text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Volver
          </button>
          <span className="font-serif text-terreta-dark text-sm">Asistente Terreta Hub · En entrenamiento</span>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-4 px-4 min-h-0">
          {messages.length === 0 ? (
            /* Estado por defecto: contexto + mascota + quick-clicks */
            <div className="max-w-xl mx-auto">
              <p className="font-serif text-terreta-dark font-semibold text-lg mb-1">
                Estás en el asistente de Terreta Hub
              </p>
              <p className="text-terreta-dark/80 font-sans text-sm mb-6">
                Pregunta lo que quieras sobre la plataforma, los proyectos, eventos o la comunidad. Estamos en fase early; el asistente sigue aprendiendo.
              </p>
              {MASCOT_IMAGE && (
                <div className="flex justify-center mb-6">
                  <img
                    src={MASCOT_IMAGE}
                    alt="Asistente Terreta Hub"
                    className="w-24 h-24 object-contain select-none"
                  />
                </div>
              )}
              <p className="text-terreta-dark/70 font-sans text-xs uppercase tracking-wider mb-3">
                Preguntas rápidas
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickClick(q)}
                    className="px-3 py-2 rounded-xl bg-terreta-bg border border-terreta-border text-terreta-dark font-sans text-sm hover:bg-terreta-accent/10 hover:border-terreta-accent transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-terreta-sidebar border border-terreta-border flex items-center justify-center">
                    {msg.role === 'user' ? (
                      user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-terreta-dark/60" aria-hidden />
                      )
                    ) : MASCOT_IMAGE ? (
                      <img src={MASCOT_IMAGE} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-terreta-accent text-lg font-serif">T</span>
                    )}
                  </div>
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-xl rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-terreta-accent text-white'
                        : 'bg-terreta-bg border border-terreta-border text-terreta-dark'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm prose-terreta-dark max-w-none font-sans text-sm text-terreta-dark [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_a]:text-terreta-accent [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-all [&_a:hover]:opacity-90 [&_a]:transition-opacity">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) =>
                              href?.startsWith('/') ? (
                                <Link to={href} className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-90 transition-opacity" {...props}>{children}</Link>
                              ) : (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-90" {...props}>{children}</a>
                              ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-sans text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-terreta-sidebar border border-terreta-border flex items-center justify-center">
                    {MASCOT_IMAGE ? (
                      <img src={MASCOT_IMAGE} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-terreta-accent font-serif">T</span>
                    )}
                  </div>
                  <div className="bg-terreta-bg border border-terreta-border rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-terreta-accent" aria-hidden />
                    <span className="text-terreta-dark text-sm">Pensando…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-xs font-sans px-4 py-1" role="alert">
            {error}
          </p>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-terreta-border bg-terreta-sidebar/30">
          <div className="flex gap-2 items-end border border-terreta-border rounded-2xl bg-terreta-bg focus-within:ring-2 focus-within:ring-terreta-accent/50 focus-within:border-terreta-accent transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje…"
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent px-4 py-3 font-sans text-terreta-dark placeholder:text-terreta-dark/70 focus:outline-none text-sm"
              disabled={isLoading}
              aria-label="Mensaje para el asistente"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 text-terreta-accent hover:bg-terreta-accent/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
              aria-label="Enviar mensaje"
            >
              <Send className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
