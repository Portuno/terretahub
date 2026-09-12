import React from 'react';
import { Link } from 'react-router-dom';
import { getAnswerPage, ANSWER_DATE_LABEL, ANSWER_DATE_MODIFIED, buildAnswerJsonLd } from '../lib/answerPages';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

interface AnswerPageProps {
  path: string;
}

export const AnswerPage: React.FC<AnswerPageProps> = ({ path }) => {
  const page = getAnswerPage(path);

  useDynamicMetaTags({
    title: page?.title,
    description: page?.description,
    url: path,
    type: 'article',
    modifiedTime: `${ANSWER_DATE_MODIFIED}T00:00:00+02:00`,
    structuredData: page ? buildAnswerJsonLd(page) : undefined,
  });

  if (!page) {
    return (
      <div className="px-4 py-10">
        <p className="text-terreta-dark/70">Esta página no está publicada.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-terreta-dark md:text-4xl">{page.h1}</h1>
      {page.lead.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="mt-4 text-base leading-relaxed text-terreta-dark/80">
          {paragraph}
        </p>
      ))}
      <p className="mt-4 text-sm text-terreta-dark/50">
        Actualizado el <time dateTime={ANSWER_DATE_MODIFIED}>{ANSWER_DATE_LABEL}</time>
      </p>
      {page.sections?.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-terreta-dark">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-3 text-base leading-relaxed text-terreta-dark/80">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      {page.faqs?.length ? (
        <section className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-terreta-dark">Preguntas frecuentes</h2>
          {page.faqs.map((faq) => (
            <div key={faq.question} className="mt-4">
              <h3 className="text-base font-semibold text-terreta-dark">{faq.question}</h3>
              <p className="mt-2 text-base leading-relaxed text-terreta-dark/80">{faq.answer}</p>
            </div>
          ))}
        </section>
      ) : null}
      {page.ctaHref && page.ctaLabel ? (
        <p className="mt-8">
          <Link
            to={page.ctaHref}
            className="inline-flex rounded-full bg-terreta-accent px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            {page.ctaLabel}
          </Link>
        </p>
      ) : null}
    </article>
  );
};
