import webpush from 'web-push';

export function getWebPush() {
  webpush.setVapidDetails(
    'mailto:info@mujcrm.cz',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}
