'use client';

// Browser-side image preparation for the sell flow. Three jobs:
//   1. HEIC → JPG conversion. iPhones photograph as HEIC by default;
//      Supabase storage rejects the MIME and most desktop browsers
//      can't render it anyway.
//   2. Compression. iPhone JPGs are 4-8 MB; Vercel serverless body
//      limit is 4.5 MB (free tier) and Supabase storage is capped at
//      5 MB/file. Compress to a safe 1.5 MB ceiling at long-edge
//      2400 px, JPEG 0.85 — visually indistinguishable from source
//      at typical web display sizes.
//   3. EXIF stripping. Geo-tagged photos publish to the open web with
//      the seller's home location embedded otherwise. Canvas-based
//      re-encode (which compression does) drops EXIF entirely as a
//      byproduct — no extra step needed.
//
// HEIC support is loaded via dynamic import only when an .heic file
// is detected, so non-iPhone users don't pay the ~200 KB tax.

import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 1.5;
const MAX_LONG_EDGE_PX = 2400;
const JPEG_QUALITY = 0.85;

// MIME types Supabase storage accepts for the aircraft-images bucket.
// HEIC isn't on the list — that's by design; we convert it to JPG
// in the browser before upload.
const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);

function isHeic(file) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

async function heicToJpeg(file) {
  // Dynamic import keeps heic2any out of the initial bundle. Only
  // the iPhone subset of users ever pulls this code.
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: JPEG_QUALITY,
  });
  // heic2any returns a Blob (or array of Blobs for multi-image HEICs).
  // Take the first frame.
  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.(heic|heif)$/i, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

/**
 * Returns a processed File ready for upload. Throws on unrecoverable
 * failure (unsupported format, decoder error, etc.) so the caller
 * can surface a useful error toast to the user.
 */
export async function processImage(file) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('processImage: input must be a File or Blob');
  }

  // 1) HEIC conversion. Run first because the result is the input to
  //    compression.
  let working = file;
  if (isHeic(working)) {
    try {
      working = await heicToJpeg(working);
    } catch (err) {
      throw new Error(
        'Could not convert HEIC photo. Try exporting it as JPG from your phone first.'
      );
    }
  }

  // 2) Reject anything that isn't an image at this point. Better to
  //    fail loudly here than upload a PDF and get a 415 from storage.
  if (!ACCEPTED_MIME.has(working.type)) {
    throw new Error(
      `Unsupported image format: ${working.type || 'unknown'}. Use JPG, PNG, WebP or HEIC.`
    );
  }

  // 3) Compress + resize. If the file is already small enough and
  //    short enough, browser-image-compression returns it unchanged.
  const compressed = await imageCompression(working, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_LONG_EDGE_PX,
    useWebWorker: true,
    initialQuality: JPEG_QUALITY,
    fileType: 'image/jpeg',
  });

  // Preserve the visual filename for the storage path but force JPG
  // extension so the bucket's MIME check passes regardless of source.
  const outName = (working.name || 'image.jpg').replace(/\.[^.]+$/, '.jpg');
  return new File([compressed], outName, { type: 'image/jpeg' });
}

/**
 * Convenience: process N files in parallel, capping concurrency at 3
 * so a 10-photo upload doesn't pin every core. Returns the new File[]
 * in the original order. Failed individual files throw — caller can
 * Promise.allSettled if partial success should be allowed.
 */
export async function processImages(files) {
  const out = new Array(files.length);
  const queue = Array.from(files).map((f, i) => ({ f, i }));
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const { f, i } = queue.shift();
      out[i] = await processImage(f);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Take a source image File + crop rectangle (pixel coords) and
 * return a new File containing just the crop. Used by the hero
 * crop modal — output is the same JPG pipeline as processImage
 * so it lands in storage at the same quality/size.
 */
export async function cropImage(file, crop) {
  const { x, y, width, height } = crop;
  const img = await new Promise((resolve, reject) => {
    const im = new window.Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = URL.createObjectURL(file);
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  URL.revokeObjectURL(img.src);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  const outName = (file.name || 'hero.jpg').replace(/\.[^.]+$/, '') + '-hero.jpg';
  const cropped = new File([blob], outName, { type: 'image/jpeg' });
  // Run through compression pipeline so the cropped output also
  // honours the 1.5 MB ceiling.
  return processImage(cropped);
}
