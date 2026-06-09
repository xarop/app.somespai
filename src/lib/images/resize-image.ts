/**
 * Client-side image downscaling. Resizes a picked/captured photo to a size
 * that's optimal for mobile/web display before it ever leaves the device,
 * cutting upload time and R2 egress. Runs only in the browser.
 */

const MAX_DIMENSION = 1280; // longest side, in CSS pixels
const JPEG_QUALITY = 0.8;

interface ResizeOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Returns a downscaled JPEG `File` for the given image file. If the image is
 * already small enough, or anything goes wrong (unsupported format, decode
 * error), the original file is returned untouched so the upload still works.
 */
export async function resizeImageFile(file: File, options: ResizeOptions = {}): Promise<File> {
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const quality = options.quality ?? JPEG_QUALITY;

  // Only attempt to resize raster images we can decode on a canvas.
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  try {
    const bitmap = await decode(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    // Already within target bounds — keep the original (avoids needless re-encode).
    if (scale === 1) {
      closeBitmap(bitmap);
      return file;
    }

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    closeBitmap(bitmap);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob) return file;

    // Don't keep the resized version if it somehow ended up larger.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

function closeBitmap(source: ImageBitmap | HTMLImageElement) {
  if ('close' in source) source.close();
}

/**
 * Decode the file into something drawable. `createImageBitmap` with
 * `imageOrientation: 'from-image'` honours EXIF rotation (common on phone
 * photos); falls back to an <img> element where unsupported.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* fall through to <img> */ }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
