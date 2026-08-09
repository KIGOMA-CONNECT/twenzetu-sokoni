import api from './api/client';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Notification.requestPermission !== undefined
  );
}

export async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export type PushEnableResult =
  | { ok: true }
  | { ok: false; error: 'unsupported' | 'denied' | 'no-sw' | 'unconfigured' | 'subscribe-failed' };

export async function enablePushNotifications(): Promise<PushEnableResult> {
  if (!isPushSupported()) {
    return { ok: false, error: 'unsupported' };
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, error: 'denied' };
  }
  const registration = await getActiveRegistration();
  if (!registration) {
    return { ok: false, error: 'no-sw' };
  }
  let publicKey = '';
  try {
    const res = await api.get('/notifications/push/vapid-public-key');
    publicKey = res.data.publicKey as string;
  } catch {
    return { ok: false, error: 'unconfigured' };
  }
  if (!publicKey) {
    return { ok: false, error: 'unconfigured' };
  }
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await api.post('/notifications/push-subscriptions', {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: subscription.toJSON().keys,
    });
  } catch {
    return { ok: false, error: 'subscribe-failed' };
  }
  return { ok: true };
}

export async function disablePushNotifications(): Promise<void> {
  const registration = await getActiveRegistration();
  if (!registration) {
    return;
  }
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await api.delete('/notifications/push-subscriptions', {
        params: { endpoint: subscription.endpoint },
      });
      await subscription.unsubscribe();
    }
  } catch {
    // ignore
  }
}

export async function getPushStatus(): Promise<{ supported: boolean; subscribed: boolean; permission: string }> {
  const supported = isPushSupported();
  if (!supported) {
    return { supported: false, subscribed: false, permission: 'unsupported' };
  }
  const permission = Notification.permission;
  let subscribed = false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    subscribed = Boolean(subscription);
  } catch {
    subscribed = false;
  }
  return { supported: true, subscribed, permission };
}
