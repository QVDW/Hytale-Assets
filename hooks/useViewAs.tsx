"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { getApiUrl } from '../src/utils/apiConfig';

interface ViewAsContextType {
    simulatedRank: string | null;
    actualRank: string | null;
    isSimulating: boolean;
    setSimulatedRank: (rank: string | null) => void;
    resetSimulation: () => void;
    canUseViewAs: boolean;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export const ViewAsProvider = ({ children }: { children: React.ReactNode }) => {
    const [simulatedRank, setSimulatedRank] = useState<string | null>(null);
    const [actualRank, setActualRank] = useState<string | null>(null);
    const [canUseViewAs, setCanUseViewAs] = useState(false);

    useEffect(() => {
        const checkDeveloperStatus = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch(getApiUrl("/api/auth/me"), {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setActualRank(userData.rank);
                    setCanUseViewAs(userData.rank === "Developer");
                }
            } catch (error) {
                console.error("Error checking developer status:", error);
            }
        };

        checkDeveloperStatus();
    }, []);

    const resetSimulation = () => {
        setSimulatedRank(null);
    };

    const isSimulating = simulatedRank !== null;

    return (
        <ViewAsContext.Provider value={{
            simulatedRank,
            actualRank,
            isSimulating,
            setSimulatedRank,
            resetSimulation,
            canUseViewAs
        }}>
            {children}
        </ViewAsContext.Provider>
    );
};

export const useViewAs = () => {
    const context = useContext(ViewAsContext);
    if (context === undefined) {
        throw new Error('useViewAs must be used within a ViewAsProvider');
    }
    return context;
};

// Hook to get the effective rank (simulated if active, otherwise actual)
export const useEffectiveRank = () => {
    const { simulatedRank, actualRank, isSimulating } = useViewAs();
    return isSimulating ? simulatedRank : actualRank;
};

export default useViewAs; 