import { useState, useEffect } from 'react';

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type PhoneSize = 'small' | 'medium' | 'large';

export interface DeviceInfo {
  type: DeviceType;
  phoneSize: PhoneSize | null;
  width: number;
  height: number;
  isTouchDevice: boolean;
  pixelRatio: number;
  isStandalone: boolean;
  hasNotch: boolean;
  safeAreaInsets: { top: number; bottom: number; left: number; right: number };
}

function getPhoneSize(width: number): PhoneSize {
  if (width <= 360) return 'small';
  if (width <= 414) return 'medium';
  return 'large';
}

function getDeviceType(width: number): DeviceType {
  if (width <= 480) return 'phone';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

function safeWindow(): boolean {
  return typeof window !== 'undefined';
}

function detectHasNotch(): boolean {
  if (!safeWindow()) return false;
  try {
    const ua = navigator.userAgent.toLowerCase();
    const hasNotchUA = /iphone\s?(1[2-9]|x|1[1-4]|pro|pro\s?max)/i.test(ua);
    const cssSupportsEnv = typeof CSS !== 'undefined' && CSS.supports('env(safe-area-inset-top)', '1px');
    return hasNotchUA || cssSupportsEnv;
  } catch {
    return false;
  }
}

function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (!safeWindow() || typeof document === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
      left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    };
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

function getInitialDeviceInfo(): DeviceInfo {
  if (!safeWindow()) {
    return { type: 'desktop', phoneSize: null, width: 1024, height: 768, isTouchDevice: false, pixelRatio: 1, isStandalone: false, hasNotch: false, safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    type: getDeviceType(w),
    phoneSize: getDeviceType(w) === 'phone' ? getPhoneSize(w) : null,
    width: w,
    height: h,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pixelRatio: window.devicePixelRatio || 1,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as NavigatorStandalone).standalone === true,
    hasNotch: detectHasNotch(),
    safeAreaInsets: getSafeAreaInsets(),
  };
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => getInitialDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setInfo({
        type: getDeviceType(w),
        phoneSize: getDeviceType(w) === 'phone' ? getPhoneSize(w) : null,
        width: w,
        height: h,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as NavigatorStandalone).standalone === true,
        hasNotch: detectHasNotch(),
        safeAreaInsets: getSafeAreaInsets(),
      });
    };

    const handleOrientation = () => setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return info;
}

export function useIsPhone(): boolean {
  return useDevice().type === 'phone';
}

export function usePhoneSize(): PhoneSize | null {
  return useDevice().phoneSize;
}
