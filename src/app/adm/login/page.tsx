"use client";

import LoginForm from "../../../../components/adm/login/LoginForm";
import useAuth from "../../../../hooks/useAuth";

export default function Login() {
    useAuth(true);

    return (
        <div className="adm-login-page">
            <LoginForm />
        </div>
    );
}