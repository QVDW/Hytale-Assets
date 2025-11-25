"use client";

import { FaEyeSlash, FaTimes } from 'react-icons/fa';
import { useViewAs } from '../../hooks/useViewAs';

const ViewAsStatus = () => {
    const { isSimulating, simulatedRank, resetSimulation, canUseViewAs } = useViewAs();

    // Only show when simulating and user is a developer
    if (!isSimulating || !canUseViewAs) {
        return null;
    }

    return (
        <div className="view-as-status">
            <div className="status-content">
                <FaEyeSlash className="status-icon" />
                <div className="status-text">
                    <span className="status-label">Viewing as:</span>
                    <span className="status-rank">{simulatedRank}</span>
                </div>
                <button 
                    className="status-close"
                    onClick={resetSimulation}
                    title="Exit ViewAs mode"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default ViewAsStatus; 