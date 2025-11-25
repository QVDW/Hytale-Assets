"use client";

import { CiSearch } from "react-icons/ci";
import { IoMdAddCircleOutline } from "react-icons/io";
import AdmNavbar from "../../../../components/adm/AdmNavbar";
import User from "../../../../components/adm/users/User";
import Link from "next/link";
import useAuth from "../../../../hooks/useAuth";
import AuthWrapper from "../../../../components/adm/AuthWrapper";
import ViewAsButton from "../../../../components/adm/ViewAsButton";
import { useEffectiveRank } from "../../../../hooks/useViewAs";
import { hasPermission, PERMISSIONS } from "../../../../src/utils/permissions";

export default function Users() {
    useAuth();
    const effectiveRank = useEffectiveRank();
    const canAddUsers = effectiveRank && hasPermission(effectiveRank, PERMISSIONS.ADD_USERS);

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <div className="adm-header">
                        <h1 className="adm-title">Users</h1>
                        <ViewAsButton />
                    </div>
                    <div id="adm-search">
                        <input type="text" placeholder="Search users..." />
                        <button className="adm-search-button adm-button"><CiSearch /></button>
                        {canAddUsers && (
                            <Link href="/adm/users/add-user" className="adm-button adm-add"><IoMdAddCircleOutline /></Link>
                        )}
                    </div>
                    <div className="adm-items">
                        <User />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}