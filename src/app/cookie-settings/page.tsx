'use client';

import { useState, useEffect } from 'react';
import { 
  getCookiePreferences, 
  saveCookiePreferences 
} from '../../utils/cookies';

import clientConfig from '../../../client.config.js';

interface Cookie {
  name: string;
  description: string;
  duration: string;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieSettingsPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load current preferences
    const currentPreferences = getCookiePreferences() as CookiePreferences;
    setPreferences({
      necessary: currentPreferences.necessary,
      analytics: clientConfig.cookies.categories.analytics?.enabled ? currentPreferences.analytics : false,
      marketing: clientConfig.cookies.categories.marketing?.enabled ? currentPreferences.marketing : false,
    });
    setIsLoading(false);
  }, []);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveCookiePreferences(preferences);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptAll = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: clientConfig.cookies.categories.analytics?.enabled || false,
      marketing: clientConfig.cookies.categories.marketing?.enabled || false,
    };
    setPreferences(newPreferences);
  };

  const handleDeclineAll = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Cookie Instellingen</h1>
            <p className="mt-2 text-gray-600">
              Beheer uw cookie voorkeuren en bepaal welke cookies wij mogen gebruiken.
            </p>
          </div>

          <div className="px-6 py-8">
            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Uw cookie voorkeuren zijn succesvol opgeslagen!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {clientConfig.cookies.categories.necessary.name}
                  </h2>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-3">Altijd actief</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {clientConfig.cookies.categories.necessary.description}
                </p>
                <div className="space-y-3">
                  {clientConfig.cookies.categories.necessary.cookies.map((cookie: Cookie, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{cookie.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{cookie.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {cookie.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Cookies */}
              {clientConfig.cookies.categories.analytics?.enabled && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {clientConfig.cookies.categories.analytics.name}
                    </h2>
                    <button
                      onClick={() => handleToggle('analytics')}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.analytics ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {clientConfig.cookies.categories.analytics.description}
                  </p>
                  <div className="space-y-3">
                    {clientConfig.cookies.categories.analytics.cookies.map((cookie: Cookie, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{cookie.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{cookie.description}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {cookie.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketing Cookies */}
              {clientConfig.cookies.categories.marketing?.enabled && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {clientConfig.cookies.categories.marketing.name}
                    </h2>
                    <button
                      onClick={() => handleToggle('marketing')}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.marketing ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {clientConfig.cookies.categories.marketing.description}
                  </p>
                  <div className="space-y-3">
                    {clientConfig.cookies.categories.marketing.cookies.map((cookie: Cookie, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{cookie.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{cookie.description}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {cookie.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSaving ? 'Opslaan...' : 'Voorkeuren opslaan'}
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Alles accepteren
              </button>
              <button
                onClick={handleDeclineAll}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Alleen noodzakelijke
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Meer informatie</h3>
              <p className="text-sm text-blue-800">
                Voor meer informatie over hoe wij cookies gebruiken, bezoek ons{' '}
                <a href="/legal/privacy" className="underline hover:no-underline">
                  privacy beleid
                </a>
                {' '}of neem contact met ons op via{' '}
                <a href={`mailto:${clientConfig.contact.email}`} className="underline hover:no-underline">
                  {clientConfig.contact.email}
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 