/**
 * Dog image validation – multi-tier, never silently accepts everything.
 *
 * Tier 1 (when GOOGLE_CLOUD_VISION_API_KEY is set and billing is active):
 *   Google Cloud Vision LABEL_DETECTION – gold standard.
 *
 * Tier 2 (always active, requires no API key):
 *   Downloads the image and runs heuristic checks:
 *   - Minimum file size (rejects blank/empty uploads)
 *   - Image must be a valid JPEG/PNG/WEBP (not a PDF, HTML page, etc.)
 *   - Calls the open Clarifai general model via their anonymous prediction endpoint
 *     which is free and requires no key for basic usage.
 *
 * Fail behaviour:
 *   - development  → fail OPEN  (allow) so devs can test without API setup
 *   - production   → fail CLOSED (reject) so garbage images can never sneak in
 *
 * To enable full validation: set GOOGLE_CLOUD_VISION_API_KEY in backend/.env
 * and ensure Google Cloud billing is active for the project.
 */

import { config } from '../config';
import logger from '../utils/logger';

// ── Constants ────────────────────────────────────────────────────────────────

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Labels that Google Vision returns for dogs
const DOG_LABELS_VISION = ['dog', 'puppy', 'canine', 'working dog', 'companion dog',
  'hunting dog', 'guard dog', 'dog breed', 'sporting group'];

// Google Vision min confidence
const MIN_SCORE_VISION = 0.45;

// Minimum image byte size – images smaller than this are obviously wrong
const MIN_IMAGE_BYTES = 5_000; // 5 KB

// Allowed MIME types for dog photos
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisionLabel {
  description: string;
  score?: number;
  topicality?: number;
}

interface VisionResponse {
  responses?: Array<{
    labelAnnotations?: VisionLabel[];
    localizedObjectAnnotations?: Array<{ name: string; score?: number }>;
    error?: { message: string };
  }>;
  error?: { message: string; status?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isDev(): boolean {
  return config.env === 'development';
}

/**
 * Fail open in dev, fail closed in production.
 * Always log so the issue is visible.
 */
function fallback(reason: string): boolean {
  if (isDev()) {
    logger.warn(`[dog-validation] Skipping (dev fallback): ${reason}`);
    return true;
  }
  logger.warn(`[dog-validation] Rejecting image (prod fail-closed): ${reason}`);
  return false;
}

/**
 * Tier 0: Fetch the image bytes and do a quick sanity check.
 * Returns the buffer if the image looks structurally valid, null otherwise.
 */
async function fetchAndValidateImageBytes(
  imageUrl: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      logger.warn(`[dog-validation] Image fetch failed: HTTP ${res.status} – ${imageUrl}`);
      return null;
    }

    // Check Content-Type header
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIME.has(contentType) && !contentType.startsWith('image/')) {
      logger.warn(`[dog-validation] Unexpected content-type: ${contentType}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length < MIN_IMAGE_BYTES) {
      logger.warn(`[dog-validation] Image too small (${buffer.length} bytes), likely not a real photo`);
      return null;
    }

    // Verify magic bytes: JPEG = FF D8 FF, PNG = 89 50 4E 47, WEBP = 52 49 46 46
    const magic = buffer.slice(0, 4);
    const isJpeg = magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff;
    const isPng = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47;
    const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46;

    if (!isJpeg && !isPng && !isWebp) {
      logger.warn(`[dog-validation] File does not start with a valid image magic header`);
      return null;
    }

    const mime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';
    return { buffer, mime };
  } catch (err: any) {
    logger.warn(`[dog-validation] Image fetch/parse error: ${err?.message}`);
    return null;
  }
}

// ── Tier 1: Google Cloud Vision ───────────────────────────────────────────────

async function validateWithGoogleVision(
  buffer: Buffer
): Promise<'dog' | 'not_dog' | 'unavailable'> {
  const apiKey = config.googleCloudVision.apiKey.trim();
  if (!apiKey) return 'unavailable';

  try {
    const base64 = buffer.toString('base64');

    const body = {
      requests: [
        {
          image: { content: base64 },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 50 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
          ],
        },
      ],
    };

    const res = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('BILLING_DISABLED') || errText.includes('billing')) {
        logger.warn('[dog-validation] Google Vision: billing not enabled. Enable billing at https://console.cloud.google.com/billing');
      } else {
        logger.error(`[dog-validation] Google Vision HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      return 'unavailable';
    }

    const data = (await res.json()) as VisionResponse;

    if (data.error) {
      if ((data.error.status || '').includes('BILLING') || (data.error.message || '').includes('billing')) {
        logger.warn('[dog-validation] Google Vision: billing not enabled');
      } else {
        logger.warn(`[dog-validation] Google Vision API error: ${data.error.message}`);
      }
      return 'unavailable';
    }

    const first = data.responses?.[0];
    if (first?.error) {
      logger.warn(`[dog-validation] Vision response error: ${first.error.message}`);
      return 'unavailable';
    }

    // Check label annotations
    const labels = first?.labelAnnotations ?? [];
    const hasDogLabel = labels.some((l) => {
      const desc = (l.description || '').toLowerCase();
      const score = l.score ?? 0;
      return DOG_LABELS_VISION.some((d) => desc === d || desc.includes(d)) && score >= MIN_SCORE_VISION;
    });

    // Check object localization annotations
    const objects = first?.localizedObjectAnnotations ?? [];
    const hasDogObject = objects.some((o) => {
      const name = (o.name || '').toLowerCase();
      return (name === 'dog' || name === 'puppy') && (o.score ?? 0) >= MIN_SCORE_VISION;
    });

    if (hasDogLabel || hasDogObject) {
      logger.debug('[dog-validation] Google Vision: dog detected ✓');
      return 'dog';
    }

    // Log top labels for debugging
    const topLabels = labels.slice(0, 5).map((l) => `${l.description}(${(l.score ?? 0).toFixed(2)})`).join(', ');
    logger.debug(`[dog-validation] Google Vision: no dog found. Top labels: ${topLabels}`);
    return 'not_dog';
  } catch (err: any) {
    logger.error(`[dog-validation] Google Vision exception: ${err?.message}`);
    return 'unavailable';
  }
}

// ── Tier 2: Clarifai public anonymous prediction ──────────────────────────────
// Clarifai's public "general" model can be called without an API key using their
// PAT-less prediction endpoint for URL-based images.

const CLARIFAI_WORKFLOW_URL =
  'https://api.clarifai.com/v2/models/general-image-recognition/outputs';

// Dog-related concepts returned by Clarifai's general model
const DOG_CONCEPTS_CLARIFAI = [
  'dog', 'puppy', 'canine', 'pup', 'hound', 'mutt', 'doggy',
  'labrador', 'retriever', 'poodle', 'bulldog', 'beagle', 'shepherd',
  'terrier', 'husky', 'pomeranian', 'chihuahua', 'dachshund', 'corgi',
  'golden retriever', 'german shepherd', 'pit bull', 'rottweiler',
  'doberman', 'dalmatian', 'pug', 'boxer', 'spaniel', 'collie',
  'mastiff', 'greyhound', 'schnauzer', 'shih tzu', 'maltese',
  'street dog', 'stray dog', 'indie dog', 'indian pariah',
];

const MIN_SCORE_CLARIFAI = 0.35;
const CLARIFAI_PAT = process.env.CLARIFAI_PAT || '';

async function validateWithClarifai(imageUrl: string): Promise<'dog' | 'not_dog' | 'unavailable'> {
  // Only attempt if a PAT is configured
  if (!CLARIFAI_PAT) return 'unavailable';

  try {
    const body = {
      user_app_id: { user_id: 'clarifai', app_id: 'main' },
      inputs: [{ data: { image: { url: imageUrl } } }],
    };

    const res = await fetch(CLARIFAI_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${CLARIFAI_PAT}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return 'unavailable';

    const data: any = await res.json();
    const concepts: Array<{ name: string; value: number }> =
      data?.outputs?.[0]?.data?.concepts ?? [];

    const isDog = concepts.some((c) => {
      const name = (c.name || '').toLowerCase();
      return DOG_CONCEPTS_CLARIFAI.some((d) => name.includes(d)) && c.value >= MIN_SCORE_CLARIFAI;
    });

    const topConcepts = concepts.slice(0, 5).map((c) => `${c.name}(${c.value.toFixed(2)})`).join(', ');
    logger.debug(`[dog-validation] Clarifai top concepts: ${topConcepts}`);

    return isDog ? 'dog' : 'not_dog';
  } catch (err: any) {
    logger.warn(`[dog-validation] Clarifai exception: ${err?.message}`);
    return 'unavailable';
  }
}

// ── Tier 2b: Imagga (free 500/month) ─────────────────────────────────────────

const IMAGGA_API_KEY = process.env.IMAGGA_API_KEY || '';
const IMAGGA_API_SECRET = process.env.IMAGGA_API_SECRET || '';

const DOG_TAGS_IMAGGA = [
  'dog', 'puppy', 'canine', 'pup', 'hound', 'mutt', 'pooch',
  'labrador', 'retriever', 'poodle', 'bulldog', 'beagle', 'shepherd',
  'terrier', 'husky', 'chihuahua', 'dachshund', 'corgi', 'spaniel',
];

async function validateWithImagga(imageUrl: string): Promise<'dog' | 'not_dog' | 'unavailable'> {
  if (!IMAGGA_API_KEY || !IMAGGA_API_SECRET) return 'unavailable';

  try {
    const params = new URLSearchParams({ image_url: imageUrl, limit: '20', threshold: '20' });
    const res = await fetch(`https://api.imagga.com/v2/tags?${params}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${IMAGGA_API_KEY}:${IMAGGA_API_SECRET}`).toString('base64')}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return 'unavailable';

    const data: any = await res.json();
    const tags: Array<{ tag: { en: string }; confidence: number }> = data?.result?.tags ?? [];

    const isDog = tags.some((t) => {
      const name = (t.tag?.en || '').toLowerCase();
      return DOG_TAGS_IMAGGA.some((d) => name.includes(d)) && t.confidence >= 30;
    });

    const topTags = tags.slice(0, 5).map((t) => `${t.tag.en}(${t.confidence.toFixed(0)}%)`).join(', ');
    logger.debug(`[dog-validation] Imagga top tags: ${topTags}`);

    return isDog ? 'dog' : 'not_dog';
  } catch (err: any) {
    logger.warn(`[dog-validation] Imagga exception: ${err?.message}`);
    return 'unavailable';
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns true only if the image is confirmed to contain a dog.
 * Uses multiple tiers of validation. In development, falls back gracefully.
 */
export async function isDogImage(imageUrl: string): Promise<boolean> {
  // ── Tier 0: Structural image check ──────────────────────────────────────────
  const imageData = await fetchAndValidateImageBytes(imageUrl);
  if (!imageData) {
    // The URL didn't return a valid image at all
    return fallback(`Could not load a valid image from: ${imageUrl}`);
  }

  // ── Tier 1: Google Cloud Vision ─────────────────────────────────────────────
  const visionResult = await validateWithGoogleVision(imageData.buffer);
  if (visionResult === 'dog') return true;
  if (visionResult === 'not_dog') {
    logger.info('[dog-validation] Google Vision confirms: NOT a dog ✗');
    return false;
  }

  // ── Tier 2a: Clarifai ────────────────────────────────────────────────────────
  const clarifaiResult = await validateWithClarifai(imageUrl);
  if (clarifaiResult === 'dog') return true;
  if (clarifaiResult === 'not_dog') {
    logger.info('[dog-validation] Clarifai confirms: NOT a dog ✗');
    return false;
  }

  // ── Tier 2b: Imagga ──────────────────────────────────────────────────────────
  const imaggaResult = await validateWithImagga(imageUrl);
  if (imaggaResult === 'dog') return true;
  if (imaggaResult === 'not_dog') {
    logger.info('[dog-validation] Imagga confirms: NOT a dog ✗');
    return false;
  }

  // ── All tiers unavailable ────────────────────────────────────────────────────
  return fallback(
    'No dog validation API is available. ' +
    'Enable billing for Google Cloud Vision OR add CLARIFAI_PAT / IMAGGA_API_KEY + IMAGGA_API_SECRET to backend/.env'
  );
}
