import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useDynamicMetaTags } from '../../hooks/useDynamicMetaTags';

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list';
  level?: number;
  text?: string;
  ordered?: boolean;
  items?: string[];
}

interface TorreSeoPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content: ContentBlock[];
  status: string;
}

export const TorreSeoPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<TorreSeoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = slug ? `/biblioteca/torre-del-semas/p/${slug}` : undefined;

  useDynamicMetaTags({
    title: page?.title,
    description: page?.meta_description ?? undefined,
    url,
  });

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Slug no válido');
      return;
    }

    const fetchPage = async () => {
      const { data, error: fetchError } = await supabase
        .from('torre_seo_pages')
        .select('id, slug, title, meta_description, content, status')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setPage(null);
        return;
      }
      if (data) {
        setPage(data as TorreSeoPage);
      } else {
        setError('Página no encontrada');
        setPage(null);
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="rounded-lg border border-terreta-border bg-terreta-card p-8 text-center">
        <p className="text-terreta-dark/70">Cargando…</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="rounded-lg border border-terreta-border bg-terreta-card p-8 text-center space-y-3">
        <p className="text-terreta-dark/80">{error ?? 'Página no encontrada'}</p>
        <Link
          to="/biblioteca/torre-del-semas"
          className="inline-block text-sm font-semibold text-terreta-accent hover:underline"
        >
          Volver a La Torre del Semás
        </Link>
      </div>
    );
  }

  const blocks = Array.isArray(page.content) ? page.content : [];

  return (
    <article className="rounded-lg border border-terreta-border bg-terreta-card p-6 md:p-8 space-y-6">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-terreta-dark">
          {page.title}
        </h1>
        {page.meta_description && (
          <p className="mt-2 text-terreta-dark/70 text-sm md:text-base">
            {page.meta_description}
          </p>
        )}
      </header>

      <div className="space-y-4">
        {blocks.map((block, index) => {
          if (block.type === 'heading' && block.text) {
            const level = Math.min(Math.max(block.level ?? 2, 1), 4);
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag
                key={index}
                className="font-serif font-bold text-terreta-dark mt-6 mb-2 first:mt-0"
              >
                {block.text}
              </Tag>
            );
          }
          if (block.type === 'paragraph' && block.text) {
            return (
              <p key={index} className="text-terreta-dark/80 leading-relaxed">
                {block.text}
              </p>
            );
          }
          if (block.type === 'list' && Array.isArray(block.items)) {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
              <ListTag
                key={index}
                className={`list-disc list-inside space-y-1 text-terreta-dark/80 ${block.ordered ? 'list-decimal' : ''}`}
              >
                {block.items.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ListTag>
            );
          }
          return null;
        })}
      </div>

      <footer className="pt-4 border-t border-terreta-border">
        <Link
          to="/biblioteca/torre-del-semas"
          className="text-sm font-semibold text-terreta-accent hover:underline"
        >
          ← La Torre del Semás
        </Link>
      </footer>
    </article>
  );
};
