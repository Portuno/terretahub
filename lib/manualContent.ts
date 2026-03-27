import developProductDigitalIndexMd from '../content/manual/desarrollar-producto-digital/index.md?raw';
import preparePresentationsIndexMd from '../content/manual/preparar-presentaciones/index.md?raw';

export type ManualIconKey = 'rocket' | 'presentation';

export type ManualArticle = {
  slug: string;
  title: string;
  md: string;
};

export type ManualCategory = {
  slug: string;
  title: string;
  description: string;
  iconKey: ManualIconKey;
  articles: ManualArticle[];
};

export const MANUAL_CATEGORIES: ManualCategory[] = [
  {
    slug: 'desarrollar-producto-digital',
    title: 'Desarrollar un producto Digital',
    description: 'De la idea al lanzamiento: estrategia, MVP, ejecución y métricas.',
    iconKey: 'rocket',
    articles: [
      {
        slug: 'index',
        title: 'Ruta completa (wiki)',
        md: developProductDigitalIndexMd,
      },
    ],
  },
  {
    slug: 'preparar-presentaciones',
    title: 'Preparar Presentaciones',
    description: 'Estructura, storytelling y diseño para comunicar con impacto.',
    iconKey: 'presentation',
    articles: [
      {
        slug: 'index',
        title: 'Guía paso a paso (wiki)',
        md: preparePresentationsIndexMd,
      },
    ],
  },
];

export const getCategoryBySlug = (categorySlug: string): ManualCategory | null => {
  return MANUAL_CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
};

export const getArticleBySlugs = (categorySlug: string, articleSlug: string): ManualArticle | null => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.articles.find((a) => a.slug === articleSlug) ?? null;
};

export const getDefaultArticleForCategory = (categorySlug: string): ManualArticle | null => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.articles[0] ?? null;
};

