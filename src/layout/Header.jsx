import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { FaList } from 'react-icons/fa';
// Removed FiSearch, FiChevronDown as they are no longer used directly here
import { useSelector } from 'react-redux';
import Notifications from '../views/components/Notifications';

const Header = ({ showSidebar, setShowSidebar }) => {
    const { userInfo } = useSelector(state => state.auth);
    // State for the live clock
    const [currentTime, setCurrentTime] = useState(new Date());

    // Effect to update time every second
    useEffect(() => {
        // Set interval to update time
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every 1000ms (1 second)

        // Cleanup function to clear interval when component unmounts
        return () => {
            clearInterval(timerId);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Format date and time for display
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit', // Optional: include seconds
        hour12: true,
    });

    // Determine user image source with fallbacks
    const userImageSrc = userInfo?.image
        ? userInfo.image
        : userInfo?.role === 'admin'
            ? '/images/admins.jpg'
            : '/images/admins.jpg';

    // Handle image loading errors
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/images/default-user.png';
    };

    return (
        <div className="fixed top-0 left-0 right-0 h-[80px] px-4 lg:px-8 z-50">
            <div className="ml-0 lg:ml-[280px] h-full flex justify-between items-center px-4 sm:px-6 relative rounded-xl overflow-hidden
                          bg-gradient-to-r from-[#252A40]/80 to-[#303650]/80 backdrop-blur-lg
                          border border-gray-700/50 shadow-lg">

                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                {/* Sidebar Toggle Button (Mobile) */}
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="w-10 h-10 rounded-lg bg-[#374151]/50 border border-gray-600 text-gray-300
                               flex justify-center items-center cursor-pointer lg:hidden
                               hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-300"
                    aria-label="Toggle sidebar"
                >
                    <FaList size={18} />
                </button>

                {/* Date and Time Display */}
                <div className="hidden md:flex flex-col items-start ml-4"> {/* Show on medium screens and up */}
                    <span className="text-sm font-semibold text-gray-100">{formattedTime}</span>
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                </div>

                {/* Spacer to push profile to the right */}
                 <div className="flex-grow"></div>

                {/* Right Side: Notifications & Profile */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Notifications Component */}
                    {userInfo && (userInfo.role === 'admin' || userInfo.role === 'seller') && <Notifications />}

                    {/* Profile Dropdown Area */}
                    <div className="flex items-center gap-3 cursor-pointer group relative" title={userInfo?.name || 'User Profile'}>
                        <img
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-cyan-500/60
                                       shadow-md group-hover:scale-105 group-hover:shadow-cyan-500/30 transition-all duration-300 flex-shrink-0"
                            src={userImageSrc}
                            alt={userInfo?.name || 'User Profile'}
                            onError={handleImageError}
                        />
                        <div className="hidden sm:flex flex-col text-right">
                            <h2 className="text-base font-semibold text-gray-100 truncate max-w-[150px]">
                                {userInfo?.name || 'User'}
                            </h2>
                            <span className="text-sm text-gray-400 capitalize">
                                {userInfo?.role || 'Role'}
                            </span>
                        </div>
                         {/* Dropdown Icon logic can remain if needed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;