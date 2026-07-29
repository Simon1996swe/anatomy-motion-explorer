import { useStore } from '../store/useStore';

export function LanguageToggle() {
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  return (
    <div className="lang-toggle" role="group" aria-label="Primary name language">
      <button
        type="button"
        className={`btn btn-sm ${language === 'en' ? 'btn-active' : ''}`}
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        type="button"
        className={`btn btn-sm ${language === 'la' ? 'btn-active' : ''}`}
        aria-pressed={language === 'la'}
        onClick={() => setLanguage('la')}
      >
        Latin
      </button>
    </div>
  );
}
