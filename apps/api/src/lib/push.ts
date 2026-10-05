import webpush from 'web-push';
import { env } from '../env';
import { prisma } from './prisma';

webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

/** Payload yang dibaca service worker (public/sw.js). */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export async function sendPushToAdmins(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany();
  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60, urgency: 'high' },
        );
        sent++;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // 404/410: langganan sudah tidak berlaku (PRD 10.7), hapus otomatis.
        if (statusCode === 404 || statusCode === 410) expired.push(subscription.id);
        else console.error('Web Push gagal dikirim', { statusCode });
      }
    }),
  );

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
  return { sent, removed: expired.length };
}
