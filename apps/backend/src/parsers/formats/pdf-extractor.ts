/**
 * PDF text extraction via pdfjs-dist with CMap support.
 *
 * pdfjs-dist correctly decodes ToUnicode/CMap tables embedded in PDFs,
 * fixing garbled text from PDFs with custom font encodings (e.g. older
 * Mercado Pago credit card statements where pdf-parse returned raw glyph
 * indices instead of Unicode characters).
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { dirname } from 'path';

// Disable the PDF.js web worker — not available in Node.js environments
GlobalWorkerOptions.workerSrc = '';

let _cmapUrl: string | undefined;

function resolveCMapUrl(): string | undefined {
  if (_cmapUrl !== undefined) return _cmapUrl || undefined;
  try {
    // require.resolve is available in Node.js CJS context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = (require as NodeRequire).resolve('pdfjs-dist/package.json');
    _cmapUrl = `${dirname(pkg)}/cmaps/`;
    return _cmapUrl;
  } catch {
    _cmapUrl = '';
    return undefined;
  }
}

function extractStr(item: unknown): string {
  if (typeof item !== 'object' || item === null) return '';
  const str = (item as Record<string, unknown>)['str'];
  return typeof str === 'string' ? str : '';
}

export async function extractPDFText(buffer: Buffer): Promise<string> {
  const cmapUrl = resolveCMapUrl();

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    ...(cmapUrl ? { cMapUrl: cmapUrl, cMapPacked: true } : {}),
    useSystemFonts: true,
    isEvalSupported: false,
    verbosity: 0,
    disableRange: true,
    disableStream: true,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push((content.items as unknown[]).map(extractStr).join(' '));
    page.cleanup();
  }

  await pdf.cleanup();
  return pages.join('\n');
}
