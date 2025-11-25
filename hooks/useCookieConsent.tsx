'use client';

import { useState, useEffect } from 'react';
import {
  hasConsent,
  getCookiePreferences,
  saveCookiePreferences,
  acceptAllCookies,
  declineAllCookies,
  initializeCookieManagement,
  getDefaultPreferences,
  hasOptionalCookies,
  getEnabledCookieCategories,
  COOKIE_CATEGORIES,
} from '../src/utils/cookies';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface UseCookieConsentReturn {
  // State
  showBanner: boolean;
  showPreferences: boolean;
  preferences: CookiePreferences;
  hasUserConsent: boolean;
  
  // Actions
  acceptAll: () => void;
  declineAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  showPreferencesModal: () => void;
  hidePreferencesModal: () => void;
  hideBanner: () => void;
  updatePreference: (category: string, value: boolean) => void;
}

export const useCookieConsent = (): UseCookieConsentReturn => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [hasUserConsent, setHasUserConsent] = useState(false);

  useEffect(() => {
    // Initialize cookie management
    initializeCookieManagement();

    // Check if there are any optional cookies enabled
    const hasOptionalCookiesEnabled = hasOptionalCookies();
    
    // Check if user has already given consent
    const userHasConsent = hasConsent();
    setHasUserConsent(userHasConsent);

    // Show banner only if there are optional cookies AND no consent has been given
    setShowBanner(hasOptionalCookiesEnabled && !userHasConsent);

    // Load current preferences
    if (userHasConsent) {
      const currentPreferences = getCookiePreferences() as CookiePreferences;
      const enabledCategories = getEnabledCookieCategories();
      
      setPreferences({
        necessary: currentPreferences.necessary,
        analytics: enabledCategories.includes('analytics') ? currentPreferences.analytics : false,
        marketing: enabledCategories.includes('marketing') ? currentPreferences.marketing : false,
      });
    }
  }, []);

  const acceptAll = () => {
    acceptAllCookies();
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    setHasUserConsent(true);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const declineAll = () => {
    declineAllCookies();
    const defaults = getDefaultPreferences() as CookiePreferences;
    setPreferences({
      necessary: defaults.necessary,
      analytics: defaults.analytics || false,
      marketing: defaults.marketing || false,
    });
    setHasUserConsent(true);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    saveCookiePreferences(prefs);
    setPreferences(prefs);
    setHasUserConsent(true);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const showPreferencesModal = () => {
    setShowPreferences(true);
  };

  const hidePreferencesModal = () => {
    setShowPreferences(false);
  };

  const hideBanner = () => {
    setShowBanner(false);
  };

  const updatePreference = (category: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  return {
    showBanner,
    showPreferences,
    preferences,
    hasUserConsent,
    acceptAll,
    declineAll,
    savePreferences,
    showPreferencesModal,
    hidePreferencesModal,
    hideBanner,
    updatePreference,
  };
}; 