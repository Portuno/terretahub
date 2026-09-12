import { describe, expect, it } from 'vitest';
import { applyPrerenderShell } from '../vite-plugin-prerender-pages';
import {
  getAnswerPage,
  renderAnswerBodyHtml,
} from '../lib/answerPages';

const shell = `<!DOCTYPE html>
<html><head>
<title>Terreta Hub · red social de Valencia</title>
<meta name="description" content="old" />
<meta property="og:url" content="https://www.terretahub.com/" />
<link rel="canonical" href="https://www.terretahub.com/" />
</head>
<body><div id="root"></div></body></html>`;

describe('answer pages', () => {
  it('la página qué-es menciona Terreta y disambigua Business Hub', () => {
    const page = getAnswerPage('/que-es-terreta-hub');
    expect(page).toBeTruthy();
    const body = renderAnswerBodyHtml(page!);
    expect(body).toContain('Terreta');
    expect(body).toContain('Business Hub');
    expect(body).toContain('<h1>');
  });

  it('la guía de Fallas menciona Fallas y Terreta en el HTML', () => {
    const page = getAnswerPage('/fallas2026');
    const body = renderAnswerBodyHtml(page!);
    expect(body).toContain('Fallas');
    expect(body).toContain('Terreta');
    expect(body).toContain('Cremà');
  });

  it('el shell prerenderizado deja el texto en el body sin JS', () => {
    const page = getAnswerPage('/que-es-terreta-hub')!;
    const html = applyPrerenderShell(
      shell,
      page.path,
      page.title,
      page.description,
      renderAnswerBodyHtml(page),
      { '@type': 'Article' }
    );
    expect(html).toContain('<h1>Qué es Terreta Hub</h1>');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('https://www.terretahub.com/que-es-terreta-hub');
  });
});
