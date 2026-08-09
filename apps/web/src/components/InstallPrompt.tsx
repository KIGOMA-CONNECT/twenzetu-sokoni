import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const inStandalone = window.navigator.standalone === true;
    if (isIos && !inStandalone && !sessionStorage.getItem('afrimarket_ios_hint')) {
      setShowIos(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismissIos = () => {
    sessionStorage.setItem('afrimarket_ios_hint', '1');
    setShowIos(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (!deferred && !showIos) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        color: '#ffffff',
        boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />
      {deferred ? (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Install afriMarket</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Shop faster with the app on your home screen.</div>
          </div>
          <button
            onClick={install}
            style={{
              background: '#ffffff',
              color: '#0f766e',
              border: 'none',
              borderRadius: 999,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Install
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Add afriMarket to your home screen</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Tap the Share button, then “Add to Home Screen”.
            </div>
          </div>
          <button
            onClick={dismissIos}
            aria-label="Dismiss"
            style={{
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 999,
              width: 30,
              height: 30,
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}
