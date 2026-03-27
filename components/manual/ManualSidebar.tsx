import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronUp, Presentation, Rocket } from 'lucide-react';
import type { ManualCategory } from '../../lib/manualContent';

interface ManualSidebarProps {
  categories: ManualCategory[];
  activeCategorySlug?: string;
  activeArticleSlug?: string;
}

const iconByKey = {
  rocket: Rocket,
  presentation: Presentation,
} as const;

export const ManualSidebar: React.FC<ManualSidebarProps> = ({
  categories,
  activeCategorySlug,
  activeArticleSlug,
}) => {
  const initialOpenCategorySlug = activeCategorySlug || categories[0]?.slug;
  const [openCategorySlug, setOpenCategorySlug] = useState<string | null>(initialOpenCategorySlug ?? null);

  const activeKey = useMemo(() => {
    if (!activeCategorySlug) return '';
    return `${activeCategorySlug}/${activeArticleSlug ?? ''}`;
  }, [activeArticleSlug, activeCategorySlug]);

  useEffect(() => {
    if (!activeCategorySlug) return;
    setOpenCategorySlug((prev) => (prev === activeCategorySlug ? prev : activeCategorySlug));
  }, [activeCategorySlug]);

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <nav className="space-y-3">
        {categories.map((category) => {
          const Icon = iconByKey[category.iconKey];
          const isOpen = openCategorySlug === category.slug;

          return (
            <div key={category.slug} className="rounded-2xl border border-terreta-border bg-terreta-card/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCategorySlug((prev) => (prev === category.slug ? null : category.slug))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-terreta-card/70 transition-colors"
                aria-label={`Categoria: ${category.title}`}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={20} className="text-terreta-accent shrink-0" aria-hidden />
                  <span className="font-sans font-bold text-sm text-terreta-dark truncate">
                    {category.title}
                  </span>
                </div>

                {isOpen ? <ChevronUp size={18} className="text-terreta-dark/70" aria-hidden /> : <ChevronDown size={18} className="text-terreta-dark/70" aria-hidden />}
              </button>

              {isOpen ? (
                <div className="px-3 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-terreta-secondary mb-2 px-2">
                    Articulos
                  </div>
                  <div className="space-y-1.5">
                    {category.articles.map((article) => {
                      const baseUrl = `/manual/${category.slug}/${article.slug}`;
                      const mdUrl = `${baseUrl}.md`;
                      const isActiveArticle = activeKey === `${category.slug}/${article.slug}`;

                      return (
                        <React.Fragment key={article.slug}>
                          <NavLink
                            to={baseUrl}
                            className={({ isActive }) =>
                              [
                                'block px-3 py-2 rounded-xl transition-colors border',
                                isActive || isActiveArticle
                                  ? 'bg-terreta-bg border-terreta-accent/30 text-terreta-dark'
                                  : 'bg-transparent border-transparent text-terreta-dark/70 hover:bg-terreta-bg/50 hover:border-terreta-border',
                              ].join(' ')
                            }
                            aria-label={`Abrir articulo: ${article.title}`}
                          >
                            <span className="text-sm font-semibold">{article.title}</span>
                          </NavLink>

                          <NavLink
                            to={mdUrl}
                            className={({ isActive }) =>
                              [
                                'block px-3 py-1.5 rounded-xl transition-colors border',
                                isActive
                                  ? 'bg-terreta-bg border-terreta-accent/30 text-terreta-accent/90'
                                  : 'bg-transparent border-transparent text-terreta-dark/60 hover:bg-terreta-bg/40 hover:border-terreta-border',
                              ].join(' ')
                            }
                            aria-label={`Abrir articulo en modo .md: ${article.title}`}
                          >
                            <span className="text-xs font-bold">Ver .md</span>
                          </NavLink>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

