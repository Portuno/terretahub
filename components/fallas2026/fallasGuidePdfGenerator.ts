import { jsPDF } from 'jspdf';
import { getFallasGuidePdfContent } from './fallasGuidePdfContent';

const FOOTER_TEXT = 'Documento creado en www.terretahub.com';
const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 12;
const BODY_END_Y = FOOTER_Y - 10;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 12;
const BODY_FONT_SIZE = 10;
const LINE_HEIGHT = 5;
const SECTION_SPACING = 8;

type Lang = 'es' | 'en';

function addFooter(doc: jsPDF): void {
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(FOOTER_TEXT, PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function ensureSpaceAndFooter(doc: jsPDF, needed: number, currentY: number): number {
  if (currentY + needed > BODY_END_Y) {
    addFooter(doc);
    doc.addPage();
    return MARGIN;
  }
  return currentY;
}

export function downloadFallasGuidePdf(lang: Lang): void {
  const doc = new jsPDF();
  const content = getFallasGuidePdfContent(lang);

  let y = MARGIN;

  // Title (first page)
  doc.setFontSize(TITLE_FONT_SIZE);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(content.title, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * LINE_HEIGHT + SECTION_SPACING;

  for (const section of content.sections) {
    doc.setFontSize(SECTION_FONT_SIZE);
    doc.setFont('helvetica', 'bold');
    const sectionTitleLines = doc.splitTextToSize(section.title, CONTENT_WIDTH);
    y = ensureSpaceAndFooter(doc, sectionTitleLines.length * LINE_HEIGHT + SECTION_SPACING, y);
    doc.text(sectionTitleLines, MARGIN, y);
    y += sectionTitleLines.length * LINE_HEIGHT + 3;

    doc.setFontSize(BODY_FONT_SIZE);
    doc.setFont('helvetica', 'normal');

    for (const line of section.lines) {
      const wrapped = doc.splitTextToSize(line, CONTENT_WIDTH);
      const blockHeight = wrapped.length * LINE_HEIGHT;
      y = ensureSpaceAndFooter(doc, blockHeight, y);
      doc.text(wrapped, MARGIN, y);
      y += blockHeight;
    }

    y += SECTION_SPACING;
  }

  addFooter(doc);

  const filename = lang === 'es' ? 'guia-fallas-2026-es.pdf' : 'guia-fallas-2026-en.pdf';
  doc.save(filename);
}
