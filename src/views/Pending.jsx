import React from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaHourglassHalf, FaUserEdit } from 'react-icons/fa'; // Added FaUserEdit

const Pending = () => {
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)] flex justify-center items-center bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            {/* Main Content Card */}
            <div className="relative z-10 w-full max-w-lg mx-auto p-6 sm:p-8 bg-[#252A40]/80 backdrop-blur-md rounded-xl border border-amber-500/50 shadow-xl shadow-amber-500/10 text-center">

                {/* Icon */}
                <div className="mb-5 text-amber-400">
                    <FaHourglassHalf className="inline-block text-5xl sm:text-6xl animate-spin-slow" />
                </div>

                {/* Heading */}
                <h1 className="text-xl sm:text-2xl font-bold text-amber-300 mb-3">
                    Account Pending Approval
                </h1>

                {/* Informational Text */}
                <p className="text-base text-gray-300 mb-4 leading-relaxed">
                    Thank you for registering! Your seller account application is currently under review.
                </p>
                {/* --- ADDED INSTRUCTION --- */}
                <p className="text-base text-gray-300 mb-6 leading-relaxed font-semibold">
                    Please ensure you have completed all required information in your profile to expedite the approval process.
                </p>
                 {/* --- END ADDED INSTRUCTION --- */}

                 <p className="text-base text-gray-300 mb-8 leading-relaxed">
                    Our support team will activate your account shortly after verification. You will be notified once your account is active.
                </p>

                {/* --- ADDED PROFILE BUTTON --- */}
                <Link
                    to="/seller/dashboard/profile" // Path to the seller's profile editing page
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#252A40] focus:ring-cyan-500"
                >
                    <FaUserEdit size={18}/>
                    Complete Your Profile
                </Link>
                 {/* --- END ADDED PROFILE BUTTON --- */}

                 {/* Optional Contact Link (Can still be useful) */}
                 <p className="text-sm text-gray-400 mt-8"> {/* Added more margin */}
                     If you have questions or believe your profile is complete and review is delayed, please
                     <Link
                         to="/seller/dashboard/chat-support" // Adjust path as needed for contacting support
                         className="text-cyan-400 hover:text-cyan-300 underline ml-1"
                     >
                         contact support
                     </Link>.
                 </p>

            </div>

             {/* Styles */}
             <style jsx>{`
                /* Wave Background */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                /* Particles */
                 .particles { background-image: radial-gradient(rgba(251, 191, 36, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px); background-size: 40px 40px, 60px 60px; background-position: 0 0, 30px 30px; animation: particleMove 35s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 30px 30px; } to { background-position: 400px 400px, 430px 430px; } }
                 /* Slow Spin Animation */
                 .animate-spin-slow { animation: spin 4s linear infinite; }
                 @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Pending;