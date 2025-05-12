import React from 'react';
import { Link } from 'react-router-dom';
// Using FaUserTimes or FaExclamationTriangle for icon
import { FaUserTimes, FaHeadset } from 'react-icons/fa'; // Added FaHeadset

const Deactive = () => {
    return (
        // Use the standard layout background and centering
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)] flex justify-center items-center bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects (Optional, keep consistent) */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            {/* Main Content Card */}
            <div className="relative z-10 w-full max-w-md mx-auto p-6 sm:p-8 bg-[#252A40]/80 backdrop-blur-md rounded-xl border border-red-600/50 shadow-xl shadow-red-500/10 text-center">

                {/* Icon */}
                <div className="mb-5 text-red-400">
                    <FaUserTimes className="inline-block text-5xl sm:text-6xl" />
                </div>

                {/* Heading */}
                <h1 className="text-xl sm:text-2xl font-bold text-red-300 mb-3">
                    Account Deactivated
                </h1>

                {/* Informational Text */}
                <p className="text-base text-gray-300 mb-8 leading-relaxed">
                    Your seller account is currently deactivated. To understand the reason or request reactivation, please get in touch with our support team.
                </p>

                {/* Action Button */}
                <Link
                    to="/seller/dashboard/chat-support" // Verify this is the correct path for seller support chat
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#252A40] focus:ring-cyan-500"
                >
                    <FaHeadset size={18}/>
                    Contact Support
                </Link>

            </div>

             {/* Optional: Add wave/particle styles if needed */}
             <style jsx>{`
                /* Wave Background */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                /* Particles */
                .particles { background-image: radial-gradient(rgba(220, 38, 38, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px); background-size: 40px 40px, 60px 60px; background-position: 0 0, 30px 30px; animation: particleMove 35s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 30px 30px; } to { background-position: 400px 400px, 430px 430px; } }
            `}</style>
        </div>
    );
};

export default Deactive;