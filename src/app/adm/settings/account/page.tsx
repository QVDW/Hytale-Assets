"use client";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import AccountSettings from "../../../../../components/adm/settings/AccountSettings";

export default function AccountSettingsPage() {
    useAuth();

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Account Instellingen</h1>
                    <AccountSettings />
                </div>
            </div>
        </AuthWrapper>
    );
} 