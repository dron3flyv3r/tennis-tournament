import React from 'react';
import { useI18n } from '../i18n';
import './LanguageToggle.css';

const LanguageToggle: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      <span className="language-label">{t('language.label')}</span>
      <div className="language-buttons">
        <button
          type="button"
          className={`language-button ${locale === 'en' ? 'active' : ''}`}
          onClick={() => setLocale('en')}
          aria-pressed={locale === 'en'}
          aria-label={t('language.english')}
        >
          EN
        </button>
        <button
          type="button"
          className={`language-button ${locale === 'da' ? 'active' : ''}`}
          onClick={() => setLocale('da')}
          aria-pressed={locale === 'da'}
          aria-label={t('language.danish')}
        >
          DA
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
