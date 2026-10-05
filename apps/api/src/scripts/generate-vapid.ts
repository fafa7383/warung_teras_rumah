// Membuat pasangan kunci VAPID untuk Web Push. Jalankan sekali, simpan hasilnya di .env.
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log('Salin ke apps/api/.env (dan ke environment Railway saat deploy):\n');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('\nJangan buat ulang setelah rilis: langganan push di HP pemilik akan ikut tidak berlaku.');
