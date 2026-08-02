import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'sw', labelKey: 'language.sw' },
  { code: 'fr', labelKey: 'language.fr' },
  { code: 'pt', labelKey: 'language.pt' },
];

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { i18n, t } = useTranslation();

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const border = dark ? '#334155' : '#cbd5e1';
  const idle = dark ? '#94a3b8' : '#64748b';
  const activeBg = '#0f766e';
  const activeColor = '#fff';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {LANGS.map((l) => {
        const active = i18n.language?.startsWith(l.code) ?? false;
        return (
          <button
            key={l.code}
            style={{
              background: active ? activeBg : 'transparent',
              color: active ? activeColor : idle,
              border: active ? `1px solid ${activeBg}` : `1px solid ${border}`,
              borderRadius: 8,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onClick={() => switchLang(l.code)}
            title={t(l.labelKey)}
          >
            {l.code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
