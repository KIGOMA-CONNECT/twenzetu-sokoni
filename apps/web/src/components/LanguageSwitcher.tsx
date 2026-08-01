import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'sw', labelKey: 'language.sw' },
  { code: 'fr', labelKey: 'language.fr' },
  { code: 'pt', labelKey: 'language.pt' },
];

const styles = {
  container: {
    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' as const,
  },
  btn: (active: boolean) => ({
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#64748b',
    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
    borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  }),
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div style={styles.container}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          style={styles.btn(i18n.language?.startsWith(l.code) ?? false)}
          onClick={() => switchLang(l.code)}
          title={t(l.labelKey)}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
