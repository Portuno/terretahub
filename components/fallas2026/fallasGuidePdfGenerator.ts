type Lang = 'es' | 'en';

export function downloadFallasGuidePdf(lang: Lang): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const publicPath =
    lang === 'es'
      ? '/Fallas-Terreta Hub (ESP).pdf'
      : '/Fallas-Terreta Hub (ENG).pdf';

  const link = document.createElement('a');
  link.href = encodeURI(publicPath);
  link.download =
    lang === 'es' ? 'Fallas-Terreta-Hub-ES.pdf' : 'Fallas-Terreta-Hub-EN.pdf';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
