import type { Worker } from 'tesseract.js';
import { preprocessForOcr } from './image';

export type OcrLang = 'fra' | 'ara' | 'eng';

let workerPromise: Promise<Worker> | null = null;
let workerLangs = '';
let progressListener: ((p: number, status: string) => void) | null = null;

/**
 * Lazily creates one Tesseract worker (free, runs entirely in the browser).
 * Language models are downloaded once from the CDN and cached by the browser.
 */
async function getWorker(langs: OcrLang[]): Promise<Worker> {
  const key = langs.join('+');
  if (workerPromise && workerLangs === key) return workerPromise;
  if (workerPromise) (await workerPromise).terminate();
  workerLangs = key;
  workerPromise = import('tesseract.js').then(({ createWorker }) =>
    createWorker(langs, 1, {
      logger: (m: { status: string; progress: number }) => progressListener?.(m.progress, m.status),
    }),
  );
  workerPromise.catch(() => {
    workerPromise = null;
  });
  return workerPromise;
}

export async function recognizeLabel(
  dataUri: string,
  langs: OcrLang[],
  onProgress?: (p: number, status: string) => void,
): Promise<{ texts: string[]; confidence: number }> {
  progressListener = onProgress ?? null;
  try {
    const worker = await getWorker(langs);
    // Two readings of the same label: the contrast-enhanced one and the original.
    // OCR mistakes rarely repeat in both, so the parser can cross-check them.
    const canvas = await preprocessForOcr(dataUri);
    const first = await worker.recognize(canvas);
    const second = await worker.recognize(dataUri);
    return { texts: [first.data.text, second.data.text], confidence: Math.max(first.data.confidence, second.data.confidence) };
  } finally {
    progressListener = null;
  }
}

/** Warm up in the background so the first scan is faster. */
export function preloadOcr(langs: OcrLang[]) {
  getWorker(langs).catch(() => {});
}
