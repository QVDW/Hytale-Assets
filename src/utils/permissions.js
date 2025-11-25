// Permission utilities
export const RANKS = {
    DEVELOPER: 'Developer',
    EIGENAAR: 'Eigenaar',
    MANAGER: 'Manager',
    WERKNEMER: 'Werknemer'
};

export const RANK_HIERARCHY = {
    [RANKS.DEVELOPER]: 4,
    [RANKS.EIGENAAR]: 3,
    [RANKS.MANAGER]: 2,
    [RANKS.WERKNEMER]: 1
};

export const PERMISSIONS = {
    // Developer permissions (highest level)
    MANAGE_DEVELOPERS: 'manage_developers',
    SYSTEM_ADMIN: 'system_admin',
    VIEW_ERROR_LOGS: 'view_error_logs',
    
    // Session management permissions (Developer and Eigenaar only)
    VIEW_ALL_SESSIONS: 'view_all_sessions',
    MANAGE_USER_SESSIONS: 'manage_user_sessions',
    VIEW_LOGIN_HISTORY: 'view_login_history',
    FORCE_LOGOUT_USERS: 'force_logout_users',
    CONFIGURE_SESSION_TIMEOUT: 'configure_session_timeout',
    
    // Eigenaar permissions
    DELETE_ITEMS: 'delete_items',
    DELETE_USERS: 'delete_users',
    DELETE_FAQ: 'delete_faq',
    MANAGE_SETTINGS: 'manage_settings',
    
    // Manager permissions
    EDIT_ITEMS: 'edit_items',
    EDIT_USERS: 'edit_users',
    EDIT_FAQ: 'edit_faq',
    ADD_ITEMS: 'add_items',
    ADD_USERS: 'add_users',
    ADD_FAQ: 'add_faq',
    
    // Werknemer permissions (basic level)
    VIEW_ITEMS: 'view_items',
    VIEW_USERS: 'view_users',
    VIEW_FAQ: 'view_faq',
    VIEW_DASHBOARD: 'view_dashboard'
};

// Permission mapping - defines what each rank can do
export const RANK_PERMISSIONS = {
    [RANKS.DEVELOPER]: [
        // Developer gets all permissions
        ...Object.values(PERMISSIONS)
    ],
    [RANKS.EIGENAAR]: [
        // Eigenaar permissions (excluding developer-specific ones)
        PERMISSIONS.VIEW_ALL_SESSIONS,
        PERMISSIONS.MANAGE_USER_SESSIONS,
        PERMISSIONS.VIEW_LOGIN_HISTORY,
        PERMISSIONS.FORCE_LOGOUT_USERS,
        PERMISSIONS.CONFIGURE_SESSION_TIMEOUT,
        PERMISSIONS.DELETE_ITEMS,
        PERMISSIONS.DELETE_USERS,
        PERMISSIONS.DELETE_FAQ,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.EDIT_ITEMS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.EDIT_FAQ,
        PERMISSIONS.ADD_ITEMS,
        PERMISSIONS.ADD_USERS,
        PERMISSIONS.ADD_FAQ,
        PERMISSIONS.VIEW_ITEMS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_FAQ,
        PERMISSIONS.VIEW_DASHBOARD
    ],
    [RANKS.MANAGER]: [
        // Manager permissions (cannot edit users or create users - only Eigenaar and Developer can)
        PERMISSIONS.EDIT_ITEMS,
        PERMISSIONS.EDIT_FAQ,
        PERMISSIONS.ADD_ITEMS,
        PERMISSIONS.ADD_FAQ,
        PERMISSIONS.VIEW_ITEMS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_FAQ,
        PERMISSIONS.VIEW_DASHBOARD
    ],
    [RANKS.WERKNEMER]: [
        // Basic permissions
        PERMISSIONS.VIEW_ITEMS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_FAQ,
        PERMISSIONS.VIEW_DASHBOARD
    ]
};

// Check if a user has a specific permission
export const hasPermission = (userRank, permission) => {
    const userPermissions = RANK_PERMISSIONS[userRank] || [];
    return userPermissions.includes(permission);
};

// Check if a user has a minimum rank level
export const hasMinimumRank = (userRank, minimumRank) => {
    const userLevel = RANK_HIERARCHY[userRank] || 0;
    const minimumLevel = RANK_HIERARCHY[minimumRank] || 0;
    return userLevel >= minimumLevel;
};

// Get ranks that are visible to a user (excludes higher ranks)
export const getVisibleRanks = (userRank) => {
    return Object.keys(RANK_HIERARCHY).filter(rank => {
        
        // Developer can see all ranks
        if (userRank === RANKS.DEVELOPER) {
            return true;
        }
        
        // Other ranks cannot see Developer
        if (rank === RANKS.DEVELOPER) {
            return false;
        }
        
        // All other ranks can see each other (Eigenaar, Manager, Werknemer)
        return true;
    });
};

// Get available ranks for user creation/editing
export const getAvailableRanks = (userRank) => {
    return Object.keys(RANK_HIERARCHY).filter(rank => {
        
        // Developer can assign all ranks
        if (userRank === RANKS.DEVELOPER) {
            return true;
        }
        
        // Only Eigenaar can assign ranks (besides Developer)
        if (userRank === RANKS.EIGENAAR) {
            // Eigenaar cannot assign Developer rank
            if (rank === RANKS.DEVELOPER) {
                return false;
            }
            // Eigenaar can assign all other ranks
            return true;
        }
        
        // Manager and Werknemer cannot assign any ranks
        return false;
    });
};

// Check if user can manage another user based on ranks
export const canManageUser = (managerRank, targetRank) => {
    const managerLevel = RANK_HIERARCHY[managerRank] || 0;
    const targetLevel = RANK_HIERARCHY[targetRank] || 0;
    
    // Developer can manage all users
    if (managerRank === RANKS.DEVELOPER) {
        return true;
    }
    
    // Cannot manage Developer users (unless you are Developer)
    if (targetRank === RANKS.DEVELOPER) {
        return false;
    }
    
    // Can manage users with lower or equal rank
    return managerLevel >= targetLevel;
};

// Check if user can view sessions of another user
export const canViewUserSessions = (viewerRank, targetUserRank) => {
    // Developer can view all sessions
    if (viewerRank === RANKS.DEVELOPER) {
        return true;
    }
    
    // Eigenaar cannot view Developer sessions
    if (viewerRank === RANKS.EIGENAAR && targetUserRank === RANKS.DEVELOPER) {
        return false;
    }
    
    // Eigenaar can view all other user sessions
    if (viewerRank === RANKS.EIGENAAR) {
        return true;
    }
    
    // Other ranks cannot view any sessions
    return false;
};

// Get visible user ranks for session management
export const getVisibleSessionUsers = (viewerRank) => {
    if (viewerRank === RANKS.DEVELOPER) {
        // Developer can see all users
        return Object.values(RANKS);
    }
    
    if (viewerRank === RANKS.EIGENAAR) {
        // Eigenaar can see all except Developer
        return [RANKS.EIGENAAR, RANKS.MANAGER, RANKS.WERKNEMER];
    }
    
    // Other ranks cannot see any session data
    return [];
};

const permissions = {
    RANKS,
    RANK_HIERARCHY,
    PERMISSIONS,
    RANK_PERMISSIONS,
    hasPermission,
    hasMinimumRank,
    getVisibleRanks,
    getAvailableRanks,
    canManageUser,
    canViewUserSessions,
    getVisibleSessionUsers
};

export default permissions; 