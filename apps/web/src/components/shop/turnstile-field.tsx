'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef } from 'react';
import { publicEnv } from '@/lib/env';

/** Cloudflare Turnstile mode managed: umumnya lolos otomatis tanpa interaksi (PRD 6.4). */
export const TurnstileField = forwardRef<
  TurnstileInstance | undefined,
  { onToken: (token: string | null) => void }
>(function TurnstileField({ onToken }, ref) {
  if (!publicEnv.turnstileSiteKey) {
    return (
      <p className="rounded-control bg-orange-soft px-3 py-2 text-footnote text-orange-text">
        Captcha belum dikonfigurasi (NEXT_PUBLIC_TURNSTILE_SITE_KEY kosong).
      </p>
    );
  }
  return (
    <div className="flex justify-center">
      <Turnstile
        ref={ref}
        siteKey={publicEnv.turnstileSiteKey}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{ theme: 'light', size: 'flexible', language: 'id' }}
        className="w-full max-w-[400px]"
      />
    </div>
  );
});
