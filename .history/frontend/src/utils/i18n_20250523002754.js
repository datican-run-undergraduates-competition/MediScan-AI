import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/zh';
import 'dayjs/locale/ja';
import 'dayjs/locale/ar';
import 'dayjs/locale/hi';
import 'dayjs/locale/ru';
import 'dayjs/locale/pt';

// Import locale-specific formats for numbers, dates, etc.
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// Supported languages with regions
const SUPPORTED_LANGUAGES = {
  'en-US': { 
    name: 'English (US)', 
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    dayjsLocale: 'en',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'en-GB': { 
    name: 'English (UK)', 
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'en',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'fr-FR': { 
    name: 'Français', 
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'fr',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'es-ES': { 
    name: 'Español', 
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'es',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'de-DE': { 
    name: 'Deutsch', 
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    dayjsLocale: 'de',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'zh-CN': { 
    name: '中文 (简体)', 
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    dayjsLocale: 'zh',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'ja-JP': { 
    name: '日本語', 
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    dayjsLocale: 'ja',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'ar-SA': { 
    name: 'العربية', 
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'ar',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'hi-IN': { 
    name: 'हिन्दी', 
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'hi',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'ru-RU': { 
    name: 'Русский', 
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    dayjsLocale: 'ru',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  },
  'pt-BR': { 
    name: 'Português (Brasil)', 
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    dayjsLocale: 'pt',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  }
};

// Default language
const DEFAULT_LANGUAGE = 'en-US';

// Special medical terms mapping
const MEDICAL_TERMS = {
  'en-US': {
    'x-ray': 'X-ray',
    'ct-scan': 'CT Scan',
    'mri': 'MRI',
    'ultrasound': 'Ultrasound',
    'diagnosis': 'Diagnosis',
    'patient': 'Patient',
    'doctor': 'Doctor',
    'hospital': 'Hospital',
    'prescription': 'Prescription',
    'dosage': 'Dosage',
    'treatment': 'Treatment',
    'surgery': 'Surgery',
    'radiology': 'Radiology',
    'oncology': 'Oncology',
    'cardiology': 'Cardiology',
    'neurology': 'Neurology',
    'pediatrics': 'Pediatrics',
    'emergency': 'Emergency',
    'intensive-care': 'Intensive Care',
    'outpatient': 'Outpatient',
    'inpatient': 'Inpatient'
  },
  'fr-FR': {
    'x-ray': 'Radiographie',
    'ct-scan': 'Scanner',
    'mri': 'IRM',
    'ultrasound': 'Échographie',
    'diagnosis': 'Diagnostic',
    'patient': 'Patient',
    'doctor': 'Médecin',
    'hospital': 'Hôpital',
    'prescription': 'Ordonnance',
    'dosage': 'Posologie',
    'treatment': 'Traitement',
    'surgery': 'Chirurgie',
    'radiology': 'Radiologie',
    'oncology': 'Oncologie',
    'cardiology': 'Cardiologie',
    'neurology': 'Neurologie',
    'pediatrics': 'Pédiatrie',
    'emergency': 'Urgence',
    'intensive-care': 'Soins Intensifs',
    'outpatient': 'Ambulatoire',
    'inpatient': 'Hospitalisé'
  },
  'es-ES': {
    'x-ray': 'Radiografía',
    'ct-scan': 'Tomografía Computarizada',
    'mri': 'Resonancia Magnética',
    'ultrasound': 'Ecografía',
    'diagnosis': 'Diagnóstico',
    'patient': 'Paciente',
    'doctor': 'Médico',
    'hospital': 'Hospital',
    'prescription': 'Receta',
    'dosage': 'Dosis',
    'treatment': 'Tratamiento',
    'surgery': 'Cirugía',
    'radiology': 'Radiología',
    'oncology': 'Oncología',
    'cardiology': 'Cardiología',
    'neurology': 'Neurología',
    'pediatrics': 'Pediatría',
    'emergency': 'Emergencia',
    'intensive-care': 'Cuidados Intensivos',
    'outpatient': 'Ambulatorio',
    'inpatient': 'Hospitalizado'
  }
  // Additional languages would be added here
};

// Create the i18n context
const I18nContext = createContext(null);

/**
 * I18n Provider Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    // Try to get from localStorage first
    const savedLocale = localStorage.getItem('userLocale');
    if (savedLocale && SUPPORTED_LANGUAGES[savedLocale]) {
      return savedLocale;
    }
    
    // Try to detect from browser
    const browserLocales = navigator.languages || [navigator.language];
    for (const browserLocale of browserLocales) {
      // Check for exact match
      if (SUPPORTED_LANGUAGES[browserLocale]) {
        return browserLocale;
      }
      
      // Check for language match without region
      const langCode = browserLocale.split('-')[0];
      const match = Object.keys(SUPPORTED_LANGUAGES).find(
        key => key.startsWith(langCode + '-')
      );
      
      if (match) {
        return match;
      }
    }
    
    // Fallback to default
    return DEFAULT_LANGUAGE;
  });
  
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Set the HTML dir attribute for RTL languages
  useEffect(() => {
    const isRTL = SUPPORTED_LANGUAGES[locale]?.rtl || false;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Set lang attribute on html element
    document.documentElement.lang = locale;
    
    // Save the locale preference
    localStorage.setItem('userLocale', locale);
    
    // Set dayjs locale
    const dayjsLocale = SUPPORTED_LANGUAGES[locale]?.dayjsLocale || 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);
  
  // Load translations for the current locale
  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      try {
        // Dynamic import of translation files
        const langCode = locale.split('-')[0];
        const translationModule = await import(`../locales/${langCode}.json`);
        setTranslations(translationModule.default);
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        // Fallback to English if translation file is missing
        if (locale !== DEFAULT_LANGUAGE) {
          const fallbackModule = await import(`../locales/en.json`);
          setTranslations(fallbackModule.default);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadTranslations();
  }, [locale]);
  
  /**
   * Translate a key
   * @param {string} key - Translation key
   * @param {Object} params - Parameters to interpolate
   * @returns {string} Translated text
   */
  const t = useCallback((key, params = {}) => {
    if (!key) return '';
    
    // Split key by dots to access nested objects
    const keys = key.split('.');
    let value = translations;
    
    // Traverse the translations object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found
        return key; // Return the key itself as fallback
      }
    }
    
    // If value is not a string, return the key
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters in the translation
    return value.replace(/{(\w+)}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }, [translations]);
  
  /**
   * Get medical terminology in the current language
   * @param {string} term - Medical term key
   * @returns {string} Localized medical term
   */
  const getMedicalTerm = useCallback((term) => {
    // Check if we have the term in the current locale
    if (MEDICAL_TERMS[locale] && MEDICAL_TERMS[locale][term]) {
      return MEDICAL_TERMS[locale][term];
    }
    
    // Fall back to English if not found
    return MEDICAL_TERMS[DEFAULT_LANGUAGE][term] || term;
  }, [locale]);
  
  /**
   * Format date according to locale
   * @param {Date|string|number} date - Date to format
   * @param {string} format - Optional custom format
   * @returns {string} Formatted date
   */
  const formatDate = useCallback((date, format) => {
    if (!date) return '';
    
    const dateObj = dayjs(date);
    if (!dateObj.isValid()) return '';
    
    if (format) {
      return dateObj.format(format);
    }
    
    // Use locale-specific date format
    return dateObj.format(SUPPORTED_LANGUAGES[locale]?.dateFormat || 'MM/DD/YYYY');
  }, [locale]);
  
  /**
   * Format number according to locale
   * @param {number} number - Number to format
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  const formatNumber = useCallback((number, options = {}) => {
    if (number === undefined || number === null) return '';
    
    try {
      const defaultOptions = SUPPORTED_LANGUAGES[locale]?.numberFormat || {};
      return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(number);
    } catch (e) {
      console.error('Error formatting number:', e);
      return number.toString();
    }
  }, [locale]);
  
  /**
   * Format a date relative to now (e.g., "2 hours ago")
   * @param {Date|string|number} date - Date to format
   * @returns {string} Relative time string
   */
  const formatRelativeTime = useCallback((date) => {
    if (!date) return '';
    
    const dateObj = dayjs(date);
    if (!dateObj.isValid()) return '';
    
    return dateObj.fromNow();
  }, []);
  
  /**
   * Change the current locale
   * @param {string} newLocale - New locale to set
   * @returns {boolean} Whether the locale was changed
   */
  const changeLocale = useCallback((newLocale) => {
    if (SUPPORTED_LANGUAGES[newLocale]) {
      setLocale(newLocale);
      return true;
    }
    return false;
  }, []);
  
  // Context value
  const contextValue = {
    locale,
    localeInfo: SUPPORTED_LANGUAGES[locale] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE],
    supportedLanguages: SUPPORTED_LANGUAGES,
    loading,
    t,
    formatDate,
    formatNumber,
    formatRelativeTime,
    changeLocale,
    getMedicalTerm,
    isRTL: SUPPORTED_LANGUAGES[locale]?.rtl || false
  };
  
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to use the i18n functions
 * @returns {Object} i18n utilities
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

/**
 * Format a date with the locale settings
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale to use
 * @param {string} format - Optional format string
 * @returns {string} Formatted date
 */
export const formatDate = (date, locale = DEFAULT_LANGUAGE, format) => {
  if (!date) return '';
  
  const dateObj = dayjs(date);
  if (!dateObj.isValid()) return '';
  
  // Set locale temporarily
  const dayjsLocale = SUPPORTED_LANGUAGES[locale]?.dayjsLocale || 'en';
  
  if (format) {
    return dateObj.locale(dayjsLocale).format(format);
  }
  
  return dateObj.locale(dayjsLocale).format(SUPPORTED_LANGUAGES[locale]?.dateFormat || 'MM/DD/YYYY');
};

/**
 * Format a number with the locale settings
 * @param {number} number - Number to format
 * @param {string} locale - Locale to use
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number
 */
export const formatNumber = (number, locale = DEFAULT_LANGUAGE, options = {}) => {
  if (number === undefined || number === null) return '';
  
  try {
    const defaultOptions = SUPPORTED_LANGUAGES[locale]?.numberFormat || {};
    return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(number);
  } catch (e) {
    console.error('Error formatting number:', e);
    return number.toString();
  }
};

/**
 * Get available languages
 * @returns {Array} Array of language objects
 */
export const getAvailableLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    ...info
  }));
};

export default {
  I18nProvider,
  useI18n,
  formatDate,
  formatNumber,
  getAvailableLanguages,
  SUPPORTED_LANGUAGES
}; 
