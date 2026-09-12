import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { absoluteUrl } from './lib/site';
import { ANSWER_PAGES, buildAnswerJsonLd, renderAnswerBodyHtml } from './lib/answerPages';

const escapeAttr = (value: string): string => value.replace(/"/g, '&quot;');

const setMetaContent = (html: string, attr: 'name' | 'property', key: string, value: string): string => {
  const re = new RegExp(`(<meta\\b[^>]*\\b${attr}="${key}"[^>]*\\bcontent=")[^"]*(")`, 'i');
  if (re.test(html)) {
    return html.replace(re, `$1${escapeAttr(value)}$2`);
  }
  return html;
};

export const applyPrerenderShell = (
  indexHtml: string,
  pagePath: string,
  title: string,
  description: string,
  body: string,
  jsonLd: unknown
): string => {
  const url = pagePath === '/' ? absoluteUrl('/') : absoluteUrl(pagePath);
  let html = indexHtml.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = setMetaContent(html, 'name', 'title', title);
  html = setMetaContent(html, 'name', 'description', description);
  html = setMetaContent(html, 'property', 'og:title', title);
  html = setMetaContent(html, 'property', 'og:description', description);
  html = setMetaContent(html, 'property', 'og:url', url);
  html = setMetaContent(html, 'name', 'twitter:title', title);
  html = setMetaContent(html, 'name', 'twitter:description', description);
  html = setMetaContent(html, 'name', 'twitter:url', url);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
};

export const prerenderAnswerPages = (): Plugin => ({
  name: 'prerender-answer-pages',
  apply: 'build',
  closeBundle() {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.warn('[prerender] dist/index.html no existe');
      return;
    }

    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    for (const page of ANSWER_PAGES) {
      const html = applyPrerenderShell(
        indexHtml,
        page.path,
        page.title,
        page.description,
        renderAnswerBodyHtml(page),
        buildAnswerJsonLd(page)
      );

      if (page.path === '/') {
        fs.writeFileSync(indexPath, html);
        continue;
      }

      const dir = path.join(distDir, page.path.replace(/^\//, ''));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
    }
  },
});
