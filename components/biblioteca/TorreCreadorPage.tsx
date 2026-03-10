import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, ExternalLink, Pencil, Loader2 } from 'lucide-react';

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list';
  level?: number;
  text?: string;
  ordered?: boolean;
  items?: string[];
}

interface TorreSeoPageRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  status: string;
  updated_at: string;
}

const DEFAULT_CONTENT: ContentBlock[] = [
  { type: 'heading', level: 1, text: '' },
  { type: 'paragraph', text: '' },
];

const slugFromTitle = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const TorreCreadorPage: React.FC = () => {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [pages, setPages] = useState<TorreSeoPageRow[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formContentJson, setFormContentJson] = useState(() =>
    JSON.stringify(DEFAULT_CONTENT, null, 2)
  );
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s ? { user: { id: s.user.id } } : null);
    setSessionLoading(false);
  }, []);

  const loadPages = useCallback(async () => {
    setPagesLoading(true);
    const { data, error } = await supabase
      .from('torre_seo_pages')
      .select('id, slug, title, meta_description, status, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      setPages([]);
    } else {
      setPages((data as TorreSeoPageRow[]) ?? []);
    }
    setPagesLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormSlug('');
    setFormTitle('');
    setFormMetaDescription('');
    setFormContentJson(JSON.stringify(DEFAULT_CONTENT, null, 2));
    setFormStatus('draft');
    setSaveError(null);
  }, []);

  const handleNewPage = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleEdit = useCallback(
    async (id: string) => {
      const row = pages.find((p) => p.id === id);
      if (!row) return;
      const { data } = await supabase
        .from('torre_seo_pages')
        .select('slug, title, meta_description, content, status')
        .eq('id', id)
        .single();
      if (data) {
        setEditingId(id);
        setFormSlug((data as { slug: string }).slug);
        setFormTitle((data as { title: string }).title);
        setFormMetaDescription((data as { meta_description: string | null }).meta_description ?? '');
        setFormContentJson(
          JSON.stringify((data as { content: ContentBlock[] }).content ?? DEFAULT_CONTENT, null, 2)
        );
        setFormStatus(((data as { status: string }).status as 'draft' | 'published') ?? 'draft');
        setSaveError(null);
      }
    },
    [pages]
  );

  const handleTitleBlur = useCallback(() => {
    if (!editingId && !formSlug && formTitle) {
      setFormSlug(slugFromTitle(formTitle));
    }
  }, [editingId, formSlug, formTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSaveError(null);
    setSaveLoading(true);

    let content: ContentBlock[];
    try {
      content = JSON.parse(formContentJson) as ContentBlock[];
      if (!Array.isArray(content)) {
        setSaveError('El contenido debe ser un array JSON.');
        setSaveLoading(false);
        return;
      }
    } catch {
      setSaveError('JSON de contenido inválido.');
      setSaveLoading(false);
      return;
    }

    const payload = {
      slug: formSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      title: formTitle.trim(),
      meta_description: formMetaDescription.trim() || null,
      content,
      status: formStatus,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('torre_seo_pages')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        setSaveError(error.message);
      } else {
        resetForm();
        loadPages();
      }
    } else {
      const { error } = await supabase.from('torre_seo_pages').insert(payload);
      if (error) {
        setSaveError(error.message);
      } else {
        resetForm();
        loadPages();
      }
    }
    setSaveLoading(false);
  };

  const isAuthenticated = !!session;

  return (
    <article className="rounded-lg border border-terreta-border bg-terreta-card p-6 md:p-8 space-y-8">
      <section>
        <h2 className="font-serif text-xl md:text-2xl font-bold text-terreta-dark mb-2">
          Creador de librerías
        </h2>
        <p className="text-terreta-dark/80 text-sm mb-4">
          Crea y edita páginas en formato JSON para motores de búsqueda. Cada página tiene slug, título,
          descripción y bloques de contenido (heading, paragraph, list).
        </p>
        {sessionLoading ? (
          <p className="text-terreta-dark/60 text-sm">Comprobando sesión…</p>
        ) : !isAuthenticated ? (
          <p className="text-terreta-dark/70 text-sm">
            <Link to="/" className="text-terreta-accent font-semibold hover:underline">
              Inicia sesión
            </Link>{' '}
            para crear y editar páginas.
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="font-semibold text-terreta-dark mb-3">Listado de páginas</h3>
        {pagesLoading ? (
          <p className="text-terreta-dark/60 text-sm flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden /> Cargando…
          </p>
        ) : pages.length === 0 ? (
          <p className="text-terreta-dark/60 text-sm">Aún no hay páginas.</p>
        ) : (
          <ul className="space-y-2" role="list">
            {pages.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-terreta-border bg-terreta-bg/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="font-medium text-terreta-dark truncate block">{p.title}</span>
                  <span className="text-xs text-terreta-dark/60">
                    /biblioteca/torre-del-semas/p/{p.slug}
                    {p.status === 'draft' && (
                      <span className="ml-2 text-amber-600">· Borrador</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'published' && (
                    <a
                      href={`/biblioteca/torre-del-semas/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-terreta-accent hover:underline"
                      aria-label={`Ver ${p.title}`}
                    >
                      <ExternalLink size={14} aria-hidden /> Ver
                    </a>
                  )}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleEdit(p.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-terreta-dark/80 hover:text-terreta-accent"
                      aria-label={`Editar ${p.title}`}
                    >
                      <Pencil size={14} aria-hidden /> Editar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAuthenticated && (
        <section>
          <h3 className="font-semibold text-terreta-dark mb-3">
            {editingId ? 'Editar página' : 'Nueva página'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label htmlFor="torre-form-title" className="block text-sm font-medium text-terreta-dark mb-1">
                Título
              </label>
              <input
                id="torre-form-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                required
                aria-required
              />
            </div>
            <div>
              <label htmlFor="torre-form-slug" className="block text-sm font-medium text-terreta-dark mb-1">
                Slug (URL)
              </label>
              <input
                id="torre-form-slug"
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="ejemplo-pagina-seo"
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                required
                aria-required
              />
              <p className="text-xs text-terreta-dark/60 mt-1">
                Solo letras minúsculas, números y guiones. Ruta: /biblioteca/torre-del-semas/p/{formSlug || '…'}
              </p>
            </div>
            <div>
              <label htmlFor="torre-form-meta" className="block text-sm font-medium text-terreta-dark mb-1">
                Meta descripción (SEO)
              </label>
              <textarea
                id="torre-form-meta"
                value={formMetaDescription}
                onChange={(e) => setFormMetaDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent resize-y"
                aria-describedby="torre-form-meta-hint"
              />
              <p id="torre-form-meta-hint" className="text-xs text-terreta-dark/60 mt-1">
                Recomendado para resultados de búsqueda.
              </p>
            </div>
            <div>
              <label htmlFor="torre-form-content" className="block text-sm font-medium text-terreta-dark mb-1">
                Contenido (JSON)
              </label>
              <textarea
                id="torre-form-content"
                value={formContentJson}
                onChange={(e) => setFormContentJson(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 font-mono text-sm text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent resize-y"
                spellCheck={false}
                aria-describedby="torre-form-content-hint"
              />
              <p id="torre-form-content-hint" className="text-xs text-terreta-dark/60 mt-1">
                Array de bloques: {"{ \"type\": \"heading\", \"level\": 1, \"text\": \"…\" }"}, {"{ \"type\": \"paragraph\", \"text\": \"…\" }"}, {"{ \"type\": \"list\", \"items\": [\"…\"] }"}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="torre-status"
                  checked={formStatus === 'draft'}
                  onChange={() => setFormStatus('draft')}
                  className="text-terreta-accent focus:ring-terreta-accent"
                  aria-label="Borrador"
                />
                <span className="text-sm text-terreta-dark">Borrador</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="torre-status"
                  checked={formStatus === 'published'}
                  onChange={() => setFormStatus('published')}
                  className="text-terreta-accent focus:ring-terreta-accent"
                  aria-label="Publicado"
                />
                <span className="text-sm text-terreta-dark">Publicado</span>
              </label>
            </div>
            {saveError && (
              <p className="text-red-600 text-sm" role="alert">
                {saveError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-terreta-accent px-4 py-2 text-sm font-semibold text-white hover:bg-terreta-accent/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                aria-label={editingId ? 'Guardar cambios' : 'Crear página'}
              >
                {saveLoading && <Loader2 size={16} className="animate-spin" aria-hidden />}
                {editingId ? 'Guardar cambios' : 'Crear página'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleNewPage}
                  className="inline-flex items-center gap-2 rounded-lg border border-terreta-border px-4 py-2 text-sm font-semibold text-terreta-dark hover:bg-terreta-card focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                  aria-label="Crear nueva página"
                >
                  <Plus size={16} aria-hidden /> Nueva
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </article>
  );
};
