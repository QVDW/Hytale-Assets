import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbAppWindow, TbUser, TbFilterQuestion, TbSettings, TbBug, TbUserCog } from "react-icons/tb";
import { FiMonitor } from "react-icons/fi";
import { useEffectiveRank } from "../../hooks/useViewAs";
import useCurrentUser from "../../hooks/useCurrentUser";
import { hasPermission, PERMISSIONS } from "../../src/utils/permissions";

export default function AdmNavbar() {
    const pathname = usePathname();
    const effectiveRank = useEffectiveRank();
    const { user } = useCurrentUser();
    
    const isActive = (path: string) => {
        if (path === "/adm") {
            return pathname === "/adm" ? "active" : "";
        }
        if (path === "/adm/settings") {
            return pathname === "/adm/settings" ? "active" : "";
        }
        return pathname?.startsWith(path) ? "active" : "";
    };
    
    // Use current user data for reliable permission checking, fallback to effective rank for ViewAs
    const userRank = user?.rank || effectiveRank;
    const canViewErrorLogs = userRank && hasPermission(userRank, PERMISSIONS.VIEW_ERROR_LOGS);
    const canViewSessions = userRank && hasPermission(userRank, PERMISSIONS.VIEW_ALL_SESSIONS);
    
    return (
        <div id="adm-navbar">
            <div id="adm-logo">
                <Link href="/adm" className={isActive("/adm")}>
                    <TbAppWindow />
                    <span className="tooltip">Dashboard</span>
                </Link>
            </div>
            <div id="adm-data">
                <Link href="/adm/users" className={isActive("/adm/users")}>
                    <TbUser />
                    <span className="tooltip">Gebruikers</span>
                </Link>
                {/* <Link href="/adm/items" className={isActive("/adm/items")}>
                    <IoImageOutline />
                    <span className="tooltip">Items</span>
                </Link> */}
                <Link href="/adm/faq" className={isActive("/adm/faq")}>
                    <TbFilterQuestion />
                    <span className="tooltip">FAQ</span>
                </Link>
                <Link href="/adm/settings" className={isActive("/adm/settings")}>
                    <TbSettings />
                    <span className="tooltip">Instellingen</span>
                </Link>
                <Link href="/adm/settings/account" className={isActive("/adm/settings/account")}>
                    <TbUserCog />
                    <span className="tooltip">Account</span>
                </Link>
                {canViewSessions && (
                    <Link href="/adm/sessions" className={isActive("/adm/sessions")}>
                        <FiMonitor />
                        <span className="tooltip">Sessions</span>
                    </Link>
                )}
                {canViewErrorLogs && (
                    <Link href="/adm/error-logs" className={isActive("/adm/error-logs")}>
                        <TbBug />
                        <span className="tooltip">Error Logs</span>
                    </Link>
                )}
            </div>
        </div>
    );
}