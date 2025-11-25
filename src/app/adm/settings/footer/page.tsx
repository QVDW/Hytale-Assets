"use client";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import FooterSettings from "../../../../../components/adm/settings/FooterSettings";

export default function FooterSettingsPage() {
    useAuth();

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Footer Settings</h1>
                    <FooterSettings />
                </div>
            </div>
        </AuthWrapper>
    );
} 