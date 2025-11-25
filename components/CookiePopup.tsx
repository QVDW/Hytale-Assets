'use client';

import { useState } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import clientConfig from '../client.config.js';

interface Cookie {
  name: string;
  description: string;
  duration: string;
}

export default function CookiePopup() {
  const {
    showBanner,
    showPreferences,
    preferences,
    acceptAll,
    declineAll,
    savePreferences,
    showPreferencesModal,
    hidePreferencesModal,
  } = useCookieConsent();

  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleCategoryToggle = (category: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
  };

  const handleShowPreferences = () => {
    setLocalPreferences(preferences);
    showPreferencesModal();
  };

  if (!showBanner && !showPreferences) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {clientConfig.cookies.banner.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {clientConfig.cookies.banner.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {clientConfig.cookies.banner.acceptAllText}
                </button>
                <button
                  onClick={declineAll}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {clientConfig.cookies.banner.declineAllText}
                </button>
                <button
                  onClick={handleShowPreferences}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {clientConfig.cookies.banner.customizeText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Cookie Voorkeuren
                </h2>
                <button
                  onClick={hidePreferencesModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clientConfig.cookies.categories.necessary.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Altijd actief</span>
                      <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {clientConfig.cookies.categories.necessary.description}
                  </p>
                  <div className="space-y-2">
                    {clientConfig.cookies.categories.necessary.cookies.map((cookie: Cookie, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{cookie.name}</p>
                            <p className="text-sm text-gray-600">{cookie.description}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {cookie.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytics Cookies */}
                {clientConfig.cookies.categories.analytics?.enabled && (
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {clientConfig.cookies.categories.analytics.name}
                      </h3>
                      <button
                        onClick={() => handleCategoryToggle('analytics', !localPreferences.analytics)}
                        className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                          localPreferences.analytics ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                        } px-1`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {clientConfig.cookies.categories.analytics.description}
                    </p>
                    <div className="space-y-2">
                      {clientConfig.cookies.categories.analytics.cookies.map((cookie: Cookie, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{cookie.name}</p>
                              <p className="text-sm text-gray-600">{cookie.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
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
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {clientConfig.cookies.categories.marketing.name}
                      </h3>
                      <button
                        onClick={() => handleCategoryToggle('marketing', !localPreferences.marketing)}
                        className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                          localPreferences.marketing ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                        } px-1`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {clientConfig.cookies.categories.marketing.description}
                    </p>
                    <div className="space-y-2">
                      {clientConfig.cookies.categories.marketing.cookies.map((cookie: Cookie, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{cookie.name}</p>
                              <p className="text-sm text-gray-600">{cookie.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {cookie.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {clientConfig.cookies.banner.saveText}
                </button>
                <button
                  onClick={() => {
                    setLocalPreferences({
                      necessary: true,
                      analytics: false,
                      marketing: false,
                    });
                    savePreferences({
                      necessary: true,
                      analytics: false,
                      marketing: false,
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {clientConfig.cookies.banner.necessaryOnlyText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 