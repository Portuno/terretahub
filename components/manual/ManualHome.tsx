import React from 'react';
import { Link } from 'react-router-dom';
import { Presentation, Rocket } from 'lucide-react';
import { MANUAL_CATEGORIES, getDefaultArticleForCategory } from '../../lib/manualContent';

const iconByKey = {
  rocket: Rocket,
  presentation: Presentation,
} as const;

export const ManualHome: React.FC = () => {
  return (
    <div className="w-full h-full">
      <main className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-terreta-dark font-bold mb-2">
            Manuales
          </h1>
        </header>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MANUAL_CATEGORIES.map((category) => {
              const Icon = iconByKey[category.iconKey];
              const defaultArticle = getDefaultArticleForCategory(category.slug);
              const articleSlug = defaultArticle?.slug ?? 'index';
              const href = `/manual/${category.slug}/${articleSlug}`;

              return (
                <Link
                  key={category.slug}
                  to={href}
                  className="card-vintage p-5 sm:p-6 rounded-2xl border cursor-pointer block group transition-all"
                  aria-label={`Abrir manual: ${category.title}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-terreta-bg border border-terreta-border flex items-center justify-center">
                        <Icon size={22} className="text-terreta-accent" aria-hidden />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-xl text-terreta-dark font-bold leading-tight">
                          {category.title}
                        </h3>
                        <p className="text-sm text-terreta-dark/70 leading-relaxed mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-terreta-secondary">
                      Entrar
                    </span>
                    <span className="text-xs font-bold text-terreta-accent group-hover:opacity-90 transition-opacity">
                      Ver wiki →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

