import { useTranslation } from 'react-i18next';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  btn: (active: boolean) => ({
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#64748b',
    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
    borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  }),
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div style={styles.container}>
      <button style={styles.btn(i18n.language === 'en')} onClick={() => switchLang('en')}>
        EN
      </button>
      <button style={styles.btn(i18n.language === 'sw')} onClick={() => switchLang('sw')}>
        SW
      </button>
    </div>
  );
}
