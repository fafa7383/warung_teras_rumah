import { MAX_UPLOAD_BYTES } from '@wtr/shared';
import sharp from 'sharp';
import { HttpError } from './http-error';

export type ImagePreset = 'menu' | 'banner' | 'logo' | 'qris' | 'proof';

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

/**
 * Validasi tipe dari isi file (bukan nama), lalu re-encode ke WebP (PRD 10.6).
 * Output sharp tidak membawa metadata, jadi EXIF seperti lokasi GPS ikut terhapus.
 */
export async function processImage(buffer: Buffer, preset: ImagePreset): Promise<Buffer> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, 'FILE_TOO_LARGE', 'Ukuran foto maksimal 5 MB');
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new HttpError(415, 'UNSUPPORTED_IMAGE', 'File ini bukan foto. Pakai JPG, PNG, atau WEBP ya');
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new HttpError(415, 'UNSUPPORTED_IMAGE', 'Foto harus JPG, PNG, atau WEBP');
  }

  // rotate() tanpa argumen mengikuti orientasi EXIF dari kamera HP.
  const image = sharp(buffer, { failOn: 'error' }).rotate();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1200;

  switch (preset) {
    case 'menu': {
      // Dipotong 1:1 di tengah, maks. 1200 px.
      const size = Math.min(1200, width, height);
      return image.resize(size, size, { fit: 'cover', position: 'centre' }).webp({ quality: 80 }).toBuffer();
    }
    case 'banner': {
      // Rasio 2:1, maks. 1200 × 600.
      const bannerWidth = Math.min(1200, width, height * 2);
      return image
        .resize(bannerWidth, Math.round(bannerWidth / 2), { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer();
    }
    case 'logo':
      return image.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
    case 'qris':
      // QR harus tetap tajam agar bisa dipindai, jadi tanpa kompresi lossy.
      return image
        .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ lossless: true })
        .toBuffer();
    case 'proof':
      return image.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  }
}
