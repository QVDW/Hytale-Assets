"use client";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import LegalSettings from "../../../../../components/adm/settings/LegalSettings";

export default function LegalSettingsPage() {
    useAuth();

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Legal Settings</h1>
                    <LegalSettings />
                </div>
            </div>
        </AuthWrapper>
    );
} 