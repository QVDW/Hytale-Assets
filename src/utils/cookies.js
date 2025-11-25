/**
 * Cookie Management Utilities
 * Handles cookie consent, storage, and retrieval
 */

// Cookie names
export const COOKIE_NAMES = {
  CONSENT: 'cookie_consent',
  PREFERENCES: 'cookie_preferences',
};

// Cookie categories
export const COOKIE_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
};

// Default cookie preferences - will be replaced by getDefaultPreferences()
export const DEFAULT_PREFERENCES = {
  [COOKIE_CATEGORIES.NECESSARY]: true,
  [COOKIE_CATEGORIES.ANALYTICS]: false,
  [COOKIE_CATEGORIES.MARKETING]: false,
};

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration
 * @param {string} path - Cookie path
 * @param {string} domain - Cookie domain
 * @param {boolean} secure - Secure flag
 * @param {string} sameSite - SameSite attribute
 */
export const setCookie = (
  name,
  value,
  days = 365,
  path = '/',
  domain = '',
  secure = false,
  sameSite = 'Lax'
) => {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  cookieString += `; SameSite=${sameSite}`;

  document.cookie = cookieString;
};

/**
 * Get a cookie by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + '=';
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path
 * @param {string} domain - Cookie domain
 */
export const deleteCookie = (name, path = '/', domain = '') => {
  if (typeof document === 'undefined') return;

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Check if user has given consent
 * @returns {boolean} True if consent has been given
 */
export const hasConsent = () => {
  const consent = getCookie(COOKIE_NAMES.CONSENT);
  return consent === 'true';
};

/**
 * Get user cookie preferences
 * @returns {object} Cookie preferences object
 */
export const getCookiePreferences = () => {
  const preferencesString = getCookie(COOKIE_NAMES.PREFERENCES);
  
  if (!preferencesString) {
    return getDefaultPreferences();
  }

  try {
    return JSON.parse(preferencesString);
  } catch (error) {
    console.error('Error parsing cookie preferences:', error);
    return getDefaultPreferences();
  }
};

/**
 * Save user cookie preferences
 * @param {object} preferences - Cookie preferences object
 */
export const saveCookiePreferences = (preferences) => {
  setCookie(COOKIE_NAMES.CONSENT, 'true', 365);
  setCookie(COOKIE_NAMES.PREFERENCES, JSON.stringify(preferences), 365);
};



/**
 * Check if a specific cookie category is enabled
 * @param {string} category - Cookie category
 * @returns {boolean} True if category is enabled
 */
export const isCookieCategoryEnabled = (category) => {
  const preferences = getCookiePreferences();
  return preferences[category] === true;
};

/**
 * Clear all cookies except necessary ones
 */
export const clearOptionalCookies = () => {
  const preferences = getCookiePreferences();
  const enabledCategories = getEnabledCookieCategories();
  
  // Clear analytics cookies if enabled and not accepted
  if (enabledCategories.includes(COOKIE_CATEGORIES.ANALYTICS) && !preferences[COOKIE_CATEGORIES.ANALYTICS]) {
    // Clear Google Analytics cookies
    const gaCookies = document.cookie.split(';').filter(cookie => 
      cookie.trim().startsWith('_ga') || 
      cookie.trim().startsWith('_gid') ||
      cookie.trim().startsWith('_gat')
    );
    
    gaCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      deleteCookie(cookieName);
      deleteCookie(cookieName, '/', window.location.hostname);
      deleteCookie(cookieName, '/', `.${window.location.hostname}`);
    });
  }
  
  // Clear marketing cookies if enabled and not accepted
  if (enabledCategories.includes(COOKIE_CATEGORIES.MARKETING) && !preferences[COOKIE_CATEGORIES.MARKETING]) {
    // Clear common marketing cookies
    const marketingCookies = ['_fbp', '_fbc', '__utm', '_gcl_au'];
    marketingCookies.forEach(cookieName => {
      deleteCookie(cookieName);
      deleteCookie(cookieName, '/', window.location.hostname);
      deleteCookie(cookieName, '/', `.${window.location.hostname}`);
    });
  }
};

/**
 * Get enabled cookie categories from config
 * @returns {Array} Array of enabled cookie categories
 */
export const getEnabledCookieCategories = () => {
  // Return default enabled categories for build-time compatibility
  // In a real application, this would be determined by configuration
  const categories = [];
  
  // Enable analytics and marketing by default for this build
  // This can be made configurable through environment variables if needed
  categories.push(COOKIE_CATEGORIES.ANALYTICS);
  categories.push(COOKIE_CATEGORIES.MARKETING);
  
  return categories;
};

/**
 * Check if there are any optional cookies enabled
 * @returns {boolean} True if any optional cookies are enabled
 */
export const hasOptionalCookies = () => {
  const enabledCategories = getEnabledCookieCategories();
  return enabledCategories.length > 0;
};

/**
 * Get default preferences based on enabled categories
 * @returns {object} Default preferences object
 */
export const getDefaultPreferences = () => {
  const enabledCategories = getEnabledCookieCategories();
  const preferences = {
    [COOKIE_CATEGORIES.NECESSARY]: true,
  };
  
  enabledCategories.forEach(category => {
    preferences[category] = false;
  });
  
  return preferences;
};

/**
 * Accept all enabled cookies
 */
export const acceptAllCookies = () => {
  const enabledCategories = getEnabledCookieCategories();
  const allAccepted = {
    [COOKIE_CATEGORIES.NECESSARY]: true,
  };
  
  enabledCategories.forEach(category => {
    allAccepted[category] = true;
  });
  
  saveCookiePreferences(allAccepted);
};

/**
 * Decline all optional cookies (keep only necessary)
 */
export const declineAllCookies = () => {
  saveCookiePreferences(getDefaultPreferences());
};

/**
 * Initialize cookie management
 * Should be called when the app starts
 */
export const initializeCookieManagement = () => {
  if (hasConsent()) {
    clearOptionalCookies();
  }
}; 