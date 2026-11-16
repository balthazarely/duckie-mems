const base = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos`;

export const thumbUrl = (id: string): string => `${base}/${id}/thumb.webp`;
export const fullUrl = (id: string): string => `${base}/${id}/full.webp`;

async function resizeImage(
  file: File,
  maxSize: number,
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  let width = bitmap.width;
  let height = bitmap.height;

  // Never upscale
  if (width <= maxSize && height <= maxSize) {
    width = bitmap.width;
    height = bitmap.height;
  } else {
    // Scale down maintaining aspect ratio
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas to blob failed'));
        else resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

export async function processImage(
  file: File
): Promise<{ full: Blob; thumb: Blob }> {
  try {
    const full = await resizeImage(file, 1600, 0.8);
    const thumb = await resizeImage(file, 400, 0.7);
    return { full, thumb };
  } catch (error) {
    if (error instanceof Error && error.message.includes('not supported')) {
      throw new Error(
        "This photo format isn't supported, try a JPG or PNG."
      );
    }
    throw error;
  }
}
