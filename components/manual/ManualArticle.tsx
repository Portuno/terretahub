import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Copy } from 'lucide-react';
import { MANUAL_CATEGORIES, getArticleBySlugs, getCategoryBySlug } from '../../lib/manualContent';
import { ManualSidebar } from './ManualSidebar';
import { CopyMarkdownButton } from './CopyMarkdownButton';
import { NotFound404 } from '../NotFound404';

type RouteParams = {
  category?: string;
  article?: string;
};

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
  img: ({ alt, ...props }: any) => (
    <img alt={alt ?? 'Imagen'} {...props} className="rounded-lg border border-terreta-border my-4" />
  ),
  h1: ({ ...props }: any) => <h1 {...props} className="font-sans text-3xl font-bold text-terreta-dark mt-8 mb-4" />,
  h2: ({ ...props }: any) => <h2 {...props} className="font-sans text-2xl font-bold text-terreta-dark mt-6 mb-3 italic" />,
  h3: ({ ...props }: any) => <h3 {...props} className="font-sans text-xl font-bold text-terreta-dark mt-4 mb-2" />,
  p: ({ ...props }: any) => <p {...props} className="text-terreta-dark mb-4 leading-relaxed" />,
  ul: ({ ...props }: any) => <ul {...props} className="list-disc list-inside mb-4 text-terreta-dark" />,
  ol: ({ ...props }: any) => <ol {...props} className="list-decimal list-inside mb-4 text-terreta-dark" />,
  li: ({ ...props }: any) => <li {...props} className="mb-1" />,
  strong: ({ ...props }: any) => <strong {...props} className="font-bold text-terreta-dark" />,
  em: ({ ...props }: any) => <em {...props} className="italic" />,
  code: ({ ...props }: any) => (
    <code {...props} className="bg-terreta-bg px-2 py-1 rounded text-sm font-mono border border-terreta-border" />
  ),
  blockquote: ({ ...props }: any) => (
    <blockquote {...props} className="border-l-4 border-terreta-accent pl-4 italic my-4 text-terreta-secondary" />
  ),
};

export const ManualArticle: React.FC = () => {
  const { category: categoryParam, article: articleParam } = useParams<RouteParams>();

  const mdMode = Boolean(articleParam && articleParam.endsWith('.md'));
  const articleSlug = useMemo(() => {
    if (!articleParam) return '';
    return mdMode ? articleParam.replace(/\.md$/, '') : articleParam;
  }, [articleParam, mdMode]);

  const category = useMemo(() => {
    if (!categoryParam) return null;
    return getCategoryBySlug(categoryParam);
  }, [categoryParam]);

  const article = useMemo(() => {
    if (!categoryParam || !articleSlug) return null;
    return getArticleBySlugs(categoryParam, articleSlug);
  }, [articleSlug, categoryParam]);

  const activeCategorySlug = categoryParam ?? MANUAL_CATEGORIES[0]?.slug;
  const activeArticleSlug = articleSlug;

  if (!category || !article) {
    return (
      <div className="max-w-6xl mx-auto w-full">
        <NotFound404 variant="generic" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-full">
        <div className="lg:sticky lg:top-6">
          <ManualSidebar
            categories={MANUAL_CATEGORIES}
            activeCategorySlug={activeCategorySlug}
            activeArticleSlug={activeArticleSlug}
          />
        </div>

        <main className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Link
                  to="/manual"
                  className="text-terreta-accent hover:opacity-80 transition-opacity text-sm font-semibold"
                  aria-label="Volver a Manuales"
                >
                  ← Manuales
                </Link>

                <span className="text-terreta-secondary text-sm">/</span>

                <span className="text-terreta-dark font-bold text-sm">{category.title}</span>
              </div>

              {mdMode ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-terreta-accent/20 bg-terreta-accent/10 text-terreta-accent text-xs font-bold">
                  <Copy size={14} aria-hidden />
                  Modo .md (texto plano)
                </span>
              ) : null}
            </div>

            <header>
              <h1 className="font-serif text-3xl md:text-4xl text-terreta-dark font-bold mb-2">
                {article.title}
              </h1>
              <p className="text-sm text-terreta-dark/70 leading-relaxed max-w-3xl">
                {category.description}
              </p>
            </header>
          </div>

          {/* Solo el cuerpo del artículo debe scrollear */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {mdMode ? (
              <section className="bg-terreta-card/40 border border-terreta-border rounded-2xl p-4 sm:p-6">
                <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-terreta-dark font-mono">
                  {article.md}
                </pre>
              </section>
            ) : (
              <article className="bg-terreta-card/40 border border-terreta-border rounded-2xl p-4 sm:p-6">
                <div className="[&_*]:scroll-mt-24">
                  <ReactMarkdown components={markdownComponents as any}>{article.md}</ReactMarkdown>
                </div>
              </article>
            )}
          </div>

          <section className="flex-shrink-0 mt-6">
            <div className="border-t border-terreta-border pt-6 space-y-6">
              <CopyMarkdownButton markdown={article.md} />

              <p className="text-xs text-terreta-dark/60 leading-relaxed">
                Tip: si quieres el texto exacto en markdown, abre esta pagina en modo <span className="font-mono font-bold">.md</span> agregando
                <span className="font-mono font-bold"> .md</span> al final del articulo en la URL.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

