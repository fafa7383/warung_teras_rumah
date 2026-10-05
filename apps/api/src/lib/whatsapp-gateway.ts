import { env } from '../env';

/**
 * Fase 2 (opsional): WhatsApp otomatis ke pemilik lewat gateway Fonnte.
 * Aktif hanya bila WA_GATEWAY_TOKEN diisi, tanpa perlu mengubah kode lain.
 */
export async function sendWhatsAppToOwner(target: string, message: string): Promise<void> {
  if (!env.WA_GATEWAY_TOKEN || !target) return;
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: env.WA_GATEWAY_TOKEN },
      body: new URLSearchParams({ target, message }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error('WA gateway menolak pesan', { status: response.status });
  } catch {
    console.error('WA gateway tidak bisa dihubungi');
  }
}

export const isWhatsAppGatewayEnabled = () => Boolean(env.WA_GATEWAY_TOKEN);
