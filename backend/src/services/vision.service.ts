/**
 * Dog image validation using Google Cloud Vision API (label detection).
 * When GOOGLE_CLOUD_VISION_API_KEY is set, only images detected as "Dog" are accepted.
 * When not set, validation is skipped (all images allowed) for development.
 */

import { config } from '../config';
import logger from '../utils/logger';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const MIN_DOG_SCORE = 0.4;
const DOG_LABELS = ['Dog', 'Puppy', 'Canine'];

interface VisionLabel {
  description: string;
  score?: number;
}

interface VisionResponse {
  responses?: Array<{
    labelAnnotations?: VisionLabel[];
    error?: { message: string };
  }>;
}

/**
 * Returns true if the image is considered to contain a dog (or validation is disabled).
 * Returns false if we have an API key and the image does not contain a dog.
 */
export async function isDogImage(imageUrl: string): Promise<boolean> {
  const apiKey = config.googleCloudVision.apiKey.trim();
  if (!apiKey) {
    logger.debug('Dog image validation skipped (no GOOGLE_CLOUD_VISION_API_KEY)');
    return true;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      logger.warn(`Could not fetch image for dog validation: ${res.status}`);
      return true; // fail open: allow when we cannot verify
    }
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const body = {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'LABEL_DETECTION', maxResults: 50 }],
        },
      ],
    };

    const visionRes = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      logger.error('Vision API error:', visionRes.status, errText);
      return true; // fail open: allow when API is unavailable
    }

    const data = (await visionRes.json()) as VisionResponse;
    const first = data.responses?.[0];
    if (first?.error) {
      logger.warn('Vision API response error:', first.error.message);
      return true; // fail open
    }

    const labels = first?.labelAnnotations ?? [];
    const hasDog = labels.some(
      (l) =>
        DOG_LABELS.some((d) => d.toLowerCase() === (l.description || '').toLowerCase()) &&
        (l.score ?? 0) >= MIN_DOG_SCORE
    );

    return hasDog;
  } catch (err) {
    logger.error('Dog image validation error:', err);
    return true; // fail open: do not block users when validation errors
  }
}
