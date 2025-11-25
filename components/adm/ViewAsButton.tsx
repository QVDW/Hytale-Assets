"use client";

import { useState } from 'react';
import { FaEye, FaEyeSlash, FaChevronDown, FaTimes } from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import { useViewAs } from '../../hooks/useViewAs';
import { RANKS } from '../../src/utils/permissions';

const ViewAsButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { 
        simulatedRank, 
        isSimulating, 
        setSimulatedRank, 
        resetSimulation, 
        canUseViewAs 
    } = useViewAs();

    // Only show for developers
    if (!canUseViewAs) {
        return null;
    }

    const handleRankSelect = (rank: string) => {
        setSimulatedRank(rank);
        setIsOpen(false);
    };

    const handleReset = () => {
        resetSimulation();
        setIsOpen(false);
    };

    const availableRanks = Object.values(RANKS).filter(rank => rank !== "Developer");

    return (
        <div className="view-as-inline-container">
            <button
                className={`view-as-inline-button ${isSimulating ? 'simulating' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={isSimulating ? `Viewing as ${simulatedRank}` : 'View as different rank'}
            >
                {isSimulating ? (
                    <>
                        <FaEyeSlash />
                        <span>Viewing as {simulatedRank}</span>
                    </>
                ) : (
                    <>
                        <FaEye />
                        <span>View As</span>
                    </>
                )}
                <FaChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="view-as-inline-dropdown">
                    <div className="dropdown-header">
                        <MdAdminPanelSettings />
                        <span>Developer Tools</span>
                    </div>
                    
                    <div className="dropdown-content">
                        {isSimulating && (
                            <button
                                className="dropdown-item reset-item"
                                onClick={handleReset}
                            >
                                <FaTimes />
                                <span>Reset to Developer view</span>
                            </button>
                        )}
                        
                        <div className="dropdown-divider">View as:</div>
                        
                        {availableRanks.map((rank) => (
                            <button
                                key={rank}
                                className={`dropdown-item ${simulatedRank === rank ? 'active' : ''}`}
                                onClick={() => handleRankSelect(rank)}
                            >
                                <span>{rank}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Background overlay when dropdown is open */}
            {isOpen && (
                <div 
                    className="view-as-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default ViewAsButton; 