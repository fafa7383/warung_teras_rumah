import { randomUUID } from 'node:crypto';
import { env } from '../env';
import { HttpError } from './http-error';
import { supabase } from './supabase';

/** Foto menu, banner, logo, QRIS → bucket publik. Mengembalikan URL publik. */
export async function uploadPublicImage(folder: string, data: Buffer): Promise<string> {
  const bucket = supabase.storage.from(env.STORAGE_PUBLIC_BUCKET);
  const path = `${folder}/${randomUUID()}.webp`;
  const { error } = await bucket.upload(path, data, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new HttpError(502, 'UPLOAD_FAILED', 'Upload foto gagal, coba lagi ya');
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Bukti bayar → bucket privat; yang disimpan di database hanya path-nya. */
export async function uploadPrivateFile(path: string, data: Buffer, contentType: string) {
  const { error } = await supabase.storage
    .from(env.STORAGE_PRIVATE_BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw new HttpError(502, 'UPLOAD_FAILED', 'Upload bukti bayar gagal, coba lagi ya');
}

export async function createPrivateSignedUrl(path: string, expiresInSeconds: number): Promise<string> {
  const { data, error } = await supabase.storage
    .from(env.STORAGE_PRIVATE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new HttpError(502, 'STORAGE_ERROR', 'Bukti bayar tidak bisa dibuka, coba lagi ya');
  return data.signedUrl;
}

export async function removePrivateFiles(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(env.STORAGE_PRIVATE_BUCKET).remove(paths);
  if (error) throw new Error(`Gagal menghapus file privat: ${error.message}`);
}
