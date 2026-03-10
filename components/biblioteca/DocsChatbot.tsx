import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const CHAT_API = '/api/chat/gemini';

const QUICK_QUESTIONS = [
  '¿Qué es Terreta Hub?',
  '¿Cómo empiezo?',
  '¿Qué es el Ágora?',
  '¿Es gratis?',
  '¿Cómo reporto contenido?',
];

export const DocsChatbot: React.FC = () => {
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
          context: 'docs',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'No se pudo conectar al asistente.');
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
        { role: 'model', text: 'Algo falló. Comprueba tu conexión e inténtalo de nuevo.' },
      ]);
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-terreta-border overflow-hidden bg-terreta-bg/30">
        <div className="flex-1 overflow-y-auto py-4 px-4 min-h-0">
          {messages.length === 0 ? (
            <div className="max-w-lg mx-auto text-center">
              <p className="font-serif text-terreta-dark font-semibold text-lg mb-1">
                Asistente de documentación
              </p>
              <p className="text-terreta-dark/70 text-sm mb-5">
                Pregunta lo que quieras sobre Terreta Hub: funcionalidades, cómo empezar, Ágora, proyectos…
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickClick(q)}
                    className="px-3 py-1.5 rounded-full bg-terreta-card border border-terreta-border text-terreta-dark text-sm hover:bg-terreta-accent/10 hover:border-terreta-accent transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                    aria-label={q}
                    tabIndex={0}
                  >
                    {q}
                  </button>
                ))}
              </div>
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
                      <span className="text-terreta-dark/60 text-xs font-bold" aria-hidden>U</span>
                    ) : (
                      <span className="text-terreta-accent text-sm font-serif" aria-hidden>T</span>
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
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) =>
                              href?.startsWith('/') ? (
                                <Link
                                  to={href}
                                  className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                                  {...props}
                                >
                                  {children}
                                </Link>
                              ) : (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-terreta-accent font-semibold underline underline-offset-2 hover:opacity-80"
                                  {...props}
                                >
                                  {children}
                                </a>
                              ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-terreta-card border border-terreta-border flex items-center justify-center">
                    <span className="text-terreta-accent text-sm font-serif" aria-hidden>T</span>
                  </div>
                  <div className="bg-terreta-card border border-terreta-border rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
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
          <p className="text-red-600 text-xs px-4 py-1 flex-shrink-0" role="alert">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 p-3 border-t border-terreta-border bg-terreta-card/50"
        >
          <div className="flex gap-2 items-end border border-terreta-border rounded-xl bg-terreta-bg focus-within:ring-2 focus-within:ring-terreta-accent/50 focus-within:border-terreta-accent transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre la documentación…"
              rows={1}
              className="flex-1 min-h-[40px] max-h-24 resize-none bg-transparent px-3.5 py-2.5 text-terreta-dark placeholder:text-terreta-dark/50 focus:outline-none text-sm"
              disabled={isLoading}
              aria-label="Mensaje al asistente de documentación"
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
  );
};
