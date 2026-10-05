// Membuat/memperbarui bucket Supabase Storage (PRD 10.1). Aman dijalankan berulang.
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from '@wtr/shared';
import { env } from '../env';
import { supabase } from '../lib/supabase';

const buckets = [
  { name: env.STORAGE_PUBLIC_BUCKET, public: true, note: 'foto menu, banner, logo, QRIS' },
  { name: env.STORAGE_PRIVATE_BUCKET, public: false, note: 'bukti bayar, hanya lewat signed URL' },
];

for (const bucket of buckets) {
  const options = {
    public: bucket.public,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
  };
  const { data: existing } = await supabase.storage.getBucket(bucket.name);
  const { error } = existing
    ? await supabase.storage.updateBucket(bucket.name, options)
    : await supabase.storage.createBucket(bucket.name, options);

  if (error) {
    console.error(`✗ Bucket "${bucket.name}" gagal disiapkan: ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  const visibility = bucket.public ? 'publik' : 'privat';
  console.log(`✓ Bucket ${visibility} "${bucket.name}" siap (${bucket.note}).`);
}
