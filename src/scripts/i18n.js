// Internationalization (i18n) Library for Dual Connect

class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('preferred_language') || 'de';
    this.translations = {};
    this.fallbackLanguage = 'de';
    this.supportedLanguages = ['de', 'en', 'tr', 'ar', 'es'];
  }

  /**
   * Initialize i18n system
   */
  async init(language = null) {
    if (language && this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
    }

    await this.loadTranslations(this.currentLanguage);
    this.applyTranslations();
    this.setupLanguageSwitcher();

    // Apply RTL for Arabic
    if (this.currentLanguage === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', this.currentLanguage);
    }

    console.log(`✅ i18n initialized: ${this.currentLanguage}`);
  }

  /**
   * Load translation file
   */
  async loadTranslations(language) {
    try {
      const response = await fetch(`/src/locales/${language}.json`);
      if (!response.ok) throw new Error(`Translation file not found: ${language}`);

      this.translations = await response.json();
      return this.translations;
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);

      // Fallback to default language
      if (language !== this.fallbackLanguage) {
        console.log(`Falling back to ${this.fallbackLanguage}`);
        const response = await fetch(`/src/locales/${this.fallbackLanguage}.json`);
        this.translations = await response.json();
      }
    }
  }

  /**
   * Get translation for a key
   */
  t(key, replacements = {}) {
    const keys = key.split('.');
    let translation = this.translations;

    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key if translation not found
      }
    }

    // Replace placeholders
    if (typeof translation === 'string') {
      for (const [placeholder, value] of Object.entries(replacements)) {
        translation = translation.replace(`{${placeholder}}`, value);
      }
    }

    return translation || key;
  }

  /**
   * Apply translations to DOM elements with data-i18n attribute
   */
  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      // Check if we should set text content or placeholder
      if (element.hasAttribute('data-i18n-placeholder')) {
        element.placeholder = translation;
      } else if (element.hasAttribute('data-i18n-title')) {
        element.title = translation;
      } else {
        element.textContent = translation;
      }
    });

    console.log(`Applied translations to ${elements.length} elements`);
  }

  /**
   * Change language
   */
  async changeLanguage(language) {
    if (!this.supportedLanguages.includes(language)) {
      console.error(`Language not supported: ${language}`);
      return false;
    }

    this.currentLanguage = language;
    localStorage.setItem('preferred_language', language);

    await this.loadTranslations(language);
    this.applyTranslations();

    // Apply RTL for Arabic
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', language);
    }

    // Update language switcher
    this.updateLanguageSwitcher();

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language }
    }));

    console.log(`✅ Language changed to: ${language}`);
    return true;
  }

  /**
   * Setup language switcher dropdown
   */
  setupLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (!switcher) return;

    // Set current language
    switcher.value = this.currentLanguage;

    // Add change listener
    switcher.addEventListener('change', async (e) => {
      const newLanguage = e.target.value;
      await this.changeLanguage(newLanguage);

      // Show toast notification
      if (typeof showToast === 'function') {
        const messages = {
          de: 'Sprache auf Deutsch geändert',
          en: 'Language changed to English',
          tr: 'Dil Türkçe olarak değiştirildi',
          ar: 'تم تغيير اللغة إلى العربية',
          es: 'Idioma cambiado a Español'
        };
        showToast(messages[newLanguage] || 'Language changed', 'success');
      }
    });
  }

  /**
   * Update language switcher to reflect current language
   */
  updateLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
      switcher.value = this.currentLanguage;
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Format date according to current language
   */
  formatDate(date, options = {}) {
    const locales = {
      de: 'de-DE',
      en: 'en-US',
      tr: 'tr-TR',
      ar: 'ar-SA',
      es: 'es-ES'
    };

    const locale = locales[this.currentLanguage] || 'de-DE';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return dateObj.toLocaleDateString(locale, options);
  }

  /**
   * Format number according to current language
   */
  formatNumber(number, options = {}) {
    const locales = {
      de: 'de-DE',
      en: 'en-US',
      tr: 'tr-TR',
      ar: 'ar-SA',
      es: 'es-ES'
    };

    const locale = locales[this.currentLanguage] || 'de-DE';
    return new Intl.NumberFormat(locale, options).format(number);
  }

  /**
   * Pluralize based on count (simple implementation)
   */
  pluralize(key, count) {
    const translation = this.t(key);

    // Simple pluralization logic
    if (count === 1) {
      return translation.singular || translation;
    } else {
      return translation.plural || translation;
    }
  }
}

// Create global instance
const i18n = new I18n();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
  });
} else {
  i18n.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
