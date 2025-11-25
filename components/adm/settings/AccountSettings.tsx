import React from 'react';
import TwoFactorSetup from './TwoFactorSetup';
import useCurrentUser from '../../../hooks/useCurrentUser';

const AccountSettings: React.FC = () => {
  const { user, isLoading: userLoading } = useCurrentUser();

  return (
    <div className="settings-container">
      <h3 className="settings-section-title">Account Beveiliging</h3>
      {userLoading ? (
        <div className="loading-text">Loading...</div>
      ) : user ? (
        <TwoFactorSetup user={user} />
      ) : (
        <div className="error-text">Failed to load user data</div>
      )}
      
      {/* Future account settings can be added here */}
      {/* 
      <h3 className="settings-section-title">Profile Settings</h3>
      <div className="settings-section">
        // Profile picture, name, email changes, etc.
      </div>
      
      <h3 className="settings-section-title">Notification Preferences</h3>
      <div className="settings-section">
        // Email notifications, SMS preferences, etc.
      </div>
      */}
    </div>
  );
};

export default AccountSettings; 