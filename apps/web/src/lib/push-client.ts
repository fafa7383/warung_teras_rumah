'use client';

import type { PushPublicKeyResponse } from '@wtr/shared';
import { adminFetch } from './admin-api';
import { isIos, isStandalone } from './device';

export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'subscribed' | 'unsubscribed';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Status Web Push di HP ini. iPhone wajib dipasang ke Home Screen dulu (iOS 16.4+, PRD 2). */
export async function getPushState(): Promise<PushState> {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? 'subscribed' : 'unsubscribed';
}

export async function subscribePush(): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'unsubscribed';

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const { publicKey } = await adminFetch<PushPublicKeyResponse>('/push/public-key');
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  await adminFetch('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
  return 'subscribed';
}

export async function unsubscribePush(): Promise<PushState> {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await adminFetch('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(
      () => undefined,
    );
    await subscription.unsubscribe();
  }
  return 'unsubscribed';
}
