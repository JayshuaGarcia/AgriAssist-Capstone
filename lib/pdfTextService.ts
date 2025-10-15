import { API_CONFIG } from './config';

// Simple PDF -> text via OCR.space API
// Note: OCR on tabular PDFs may lose layout, but is robust and works without native modules

const OCR_API_URL = 'https://api.ocr.space/parse/image';

export async function pdfBase64ToText(pdfBase64: string): Promise<string> {
  const form = new FormData();
  form.append('base64Image', `data:application/pdf;base64,${pdfBase64}`);
  form.append('OCREngine', '2'); // better accuracy
  form.append('scale', 'true');
  form.append('isTable', 'true');
  form.append('detectOrientation', 'true');
  form.append('isOverlayRequired', 'false');

  const resp = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: {
      apikey: (API_CONFIG as any).OCR_SPACE_API_KEY || '',
    },
    body: form as any,
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OCR API error ${resp.status}: ${t}`);
  }

  const json = await resp.json();
  if (!json || !json.ParsedResults || !json.ParsedResults.length) {
    throw new Error('OCR returned no results');
  }
  const texts = json.ParsedResults.map((r: any) => r.ParsedText || '').join('\n');
  return texts.trim();
}



