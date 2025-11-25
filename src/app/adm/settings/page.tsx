"use client";

import AdmNavbar from "../../../../components/adm/AdmNavbar";
import useAuth from "../../../../hooks/useAuth";
import AuthWrapper from "../../../../components/adm/AuthWrapper";
import Settings from "../../../../components/adm/settings/Settings";


export default function Items() {
    useAuth();

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Instellingen</h1>
                    <Settings />
                </div>
            </div>
        </AuthWrapper>
    );
}