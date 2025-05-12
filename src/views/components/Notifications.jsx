import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaBell, FaRegBell } from 'react-icons/fa';
import io from 'socket.io-client';
import {
    toggleNotificationDropdown,
    fetchUnreadCount,
    updateUnreadCount,
} from '../../store/Reducers/notificationReducer';

const Notifications = () => {
    const dispatch = useDispatch();
    const { unreadCount, loading } = useSelector(state => state.notifications);
    const isOpen = useSelector(state => state.notifications.isDropdownOpen);
    const buttonRef = useRef(null);
    const socketRef = useRef(null);

    // Initialize Socket.IO and fetch unread count on mount
    useEffect(() => {
        // Fetch unread count on component mount
        dispatch(fetchUnreadCount()).catch(err => console.error('[Notifications] Error fetching unread count:', err));

        // Set up Socket.IO connection
        socketRef.current = io('http://localhost:5000', {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Join admin room and listen for unread count updates
        socketRef.current.emit('add_admin', { id: 'admin' }); // Match server.js add_admin
        socketRef.current.on('unread_count_update', (data) => {
            console.log('[Notifications] Received unread_count_update:', data);
            dispatch(updateUnreadCount(data.unreadCount));
        });

        // Clean up Socket.IO on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log('[Notifications] Socket.IO disconnected');
            }
        };
    }, [dispatch]);

    const handleToggle = (event) => {
        event.stopPropagation();
        console.log('[Notifications Bell] Toggling dropdown via Redux action.');
        dispatch(toggleNotificationDropdown());
    };

    return (
        <div>
            {/* Bell Button */}
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="relative text-white text-xl hover:text-gray-300 focus:outline-none p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Toggle Notifications"
                aria-haspopup="true"
                aria-expanded={isOpen}
                disabled={loading}
            >
                {unreadCount > 0 ? (
                    <FaBell className="animate-swing text-yellow-400" />
                ) : (
                    <FaRegBell />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {/* Embedded CSS for bell swing and badge pulse animations */}
            <style jsx>{`
                @keyframes swing {
                    15% { transform: rotate(5deg); }
                    30% { transform: rotate(-5deg); }
                    40% { transform: rotate(3deg); }
                    50% { transform: rotate(-3deg); }
                    65% { transform: rotate(1deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-swing {
                    display: inline-block;
                    animation: swing ease-in-out 0.8s 1 alternate;
                }
                .animate-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Notifications;