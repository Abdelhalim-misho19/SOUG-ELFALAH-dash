
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    FaBell, FaRegBell, FaCheckDouble, FaTrashAlt, FaSpinner,
    FaShoppingCart, FaEnvelopeOpenText, FaUserClock, FaInfoCircle, FaCheck, FaMoneyCheckAlt, FaCalendarCheck
} from 'react-icons/fa';
import moment from 'moment';
import { Tooltip } from 'react-tooltip';
import {
    markNotificationReadAPI,
    markAllNotificationsReadAPI,
    clearAllNotificationsAPI,
    deleteNotificationAPI,
    fetchNotifications,
    clearNotificationError,
    closeNotificationDropdown,
    openNotificationDropdown
} from '../../store/Reducers/notificationReducer';

// Helper function for Icons
const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'order':
            return <FaShoppingCart className="text-blue-400 group-hover:text-blue-300 transition-colors duration-150" />;
        case 'message':
            return <FaEnvelopeOpenText className="text-green-400 group-hover:text-green-300 transition-colors duration-150" />;
        case 'seller_request':
            return <FaUserClock className="text-yellow-400 group-hover:text-yellow-300 transition-colors duration-150" />;
        case 'withdrawal':
            return <FaMoneyCheckAlt className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-150" />;
        case 'booking':
            return <FaCalendarCheck className="text-purple-400 group-hover:text-purple-300 transition-colors duration-150" />;
        default:
            return <FaInfoCircle className="text-gray-400 group-hover:text-gray-300 transition-colors duration-150" />;
    }
};

const NotificationDropdown = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount, loading, error, isDropdownOpen } = useSelector(state => state.notifications);
    const dropdownRef = useRef(null);
    const [isFetching, setIsFetching] = useState(false);
    const [hoveredItemId, setHoveredItemId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const prevNotificationsLength = useRef(notifications.length);

    // Auto-open dropdown on new notification
    useEffect(() => {
        if (notifications.length > prevNotificationsLength.current && !isDropdownOpen) {
            dispatch(openNotificationDropdown());
        }
        prevNotificationsLength.current = notifications.length;
    }, [notifications.length, isDropdownOpen, dispatch]);

    // Fetch Notifications on Open
    useEffect(() => {
        if (isDropdownOpen) {
            dispatch(clearNotificationError());
            loadNotifications();
        }
    }, [isDropdownOpen, dispatch]);

    const loadNotifications = async (beSilent = false) => {
        if (!beSilent) setIsFetching(true);
        try {
            await dispatch(fetchNotifications({ page: 1, parPage: 50 })).unwrap();
        } catch (fetchError) {
            console.error('[Dropdown] loadNotifications Error:', fetchError);
        } finally {
            if (!beSilent) setIsFetching(false);
        }
    };

    // Handle clicks on individual notification items
    const handleNotificationClick = (notification, event) => {
        if (event.target.closest('button')) {
            event.stopPropagation();
            return;
        }
        const idToMark = notification?._id || notification?.id;
        if (idToMark && (notification?.status === 'unread' || !notification?.read)) {
            dispatch(markNotificationReadAPI(idToMark))
                .unwrap()
                .catch(err => console.error('API Error marking read on click:', err));
        }
        if (notification?.link) {
            navigate(notification.link);
        }
        dispatch(closeNotificationDropdown());
    };

    // Mark specific item read
    const handleMarkOneRead = (notification, event) => {
        event.stopPropagation();
        const idToMark = notification?._id || notification?.id;
        if (idToMark && (notification?.status === 'unread' || !notification?.read)) {
            console.log(`[Dropdown] Dispatching markNotificationReadAPI for: ${idToMark}`);
            dispatch(markNotificationReadAPI(idToMark))
                .unwrap()
                .then(() => console.log(`[Dropdown] Mark read API success for ${idToMark}`))
                .catch(err => console.error('API Error marking one read:', err));
        } else {
            console.log(`[Dropdown] Notification ${idToMark} already read or invalid, skipping API call.`);
        }
    };

    // Delete specific item
    const handleDeleteOne = async (notification, event) => {
        event.stopPropagation();
        const idToDelete = notification?._id || notification?.id;
        if (idToDelete && !deletingId) {
            console.log('Dispatching deleteNotificationAPI for:', idToDelete);
            setDeletingId(idToDelete);
            try {
                await dispatch(deleteNotificationAPI(idToDelete)).unwrap();
            } catch (err) {
                console.error('API Error deleting notification:', err);
                alert(err?.error || 'Failed to delete notification.');
            } finally {
                setDeletingId(null);
            }
        }
    };

    // Dropdown Header Actions
    const handleMarkAllRead = (event) => {
        event.stopPropagation();
        if (unreadCount > 0) {
            dispatch(markAllNotificationsReadAPI())
                .unwrap()
                .catch(err => console.error('API Error marking all read:', err));
        }
    };

    // Clear all notifications
    const handleClearAll = (event) => {
        event.stopPropagation();
        if (notifications?.length > 0) {
            dispatch(clearAllNotificationsAPI())
                .unwrap()
                .catch(err => console.error('API Error clearing all:', err));
        }
    };

    // Close on Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                dispatch(closeNotificationDropdown());
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen, dispatch]);

    // Don't render if closed
    if (!isDropdownOpen) return null;

    return (
        <>
            <Tooltip id="notification-actions" place="bottom" effect="solid" />
            <div
                ref={dropdownRef}
                className={`
                    fixed w-80 md:w-96 max-h-[80vh] flex flex-col
                    bg-gray-900/95 backdrop-blur-xl border border-gray-700/40
                    rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-[100]
                    transition-opacity duration-300 ease-out
                    ${isDropdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                style={{ top: '70px', right: '16px' }}
                role="menu"
                aria-orientation="vertical"
                aria-hidden={!isDropdownOpen}
            >
                {/* Header Section */}
                <div className="sticky top-0 flex-shrink-0 bg-gray-800/90 backdrop-blur-lg px-4 py-3 border-b border-gray-700/40 flex justify-between items-center z-10">
                    <h3 className="text-base font-semibold text-white tracking-tight">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {notifications?.length > 0 && unreadCount > 0 && (
                            <button
                                data-tooltip-id="notification-actions"
                                data-tooltip-content="Mark all as read"
                                disabled={loading || isFetching || !!deletingId}
                                onClick={handleMarkAllRead}
                                className="p-2 rounded-full text-blue-400 hover:text-blue-300 hover:bg-gray-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                                aria-label="Mark all notifications as read"
                            >
                                <FaCheckDouble size={16} />
                            </button>
                        )}
                        {notifications?.length > 0 && (
                            <button
                                data-tooltip-id="notification-actions"
                                data-tooltip-content="Clear all notifications"
                                disabled={loading || isFetching || !!deletingId}
                                onClick={handleClearAll}
                                className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-gray-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                                aria-label="Clear all notifications"
                            >
                                <FaTrashAlt size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable List Section */}
                <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/80 scrollbar-track-gray-800/30">
                    <div className="divide-y divide-gray-700/20">
                        {/* Loading/Error/Empty States */}
                        {(loading || isFetching) && (
                            <div className="px-4 py-6 text-sm text-center text-gray-400 flex items-center justify-center">
                                <FaSpinner className="animate-spin mr-2" size={16} /> Loading...
                            </div>
                        )}
                        {error && !(loading || isFetching) && (
                            <div className="px-4 py-4 text-sm text-center text-red-400 bg-red-900/20 border-y border-red-700/30">
                                Failed to load. Please try again.
                            </div>
                        )}
                        {!loading && !isFetching && !error && (!Array.isArray(notifications) || notifications.length === 0) && (
                            <div className="px-4 py-10 text-sm text-center text-gray-400">
                                <FaRegBell className="mx-auto mb-2 h-8 w-8 text-gray-500" />
                                You're all caught up!
                            </div>
                        )}

                        {/* Notification Items List */}
                        {!loading && !isFetching && !error && Array.isArray(notifications) && notifications.length > 0 && (
                            notifications.map((notification, index) => {
                                const messageText = notification?.message || 'No message content.';
                                let timeAgo = 'Unknown time';
                                const timestampToUse = notification?.createdAt || notification?.timestamp;
                                if (timestampToUse && moment(timestampToUse).isValid()) {
                                    timeAgo = moment(timestampToUse).fromNow();
                                }
                                const isUnread = notification?.status === 'unread' || !notification?.read;
                                const notificationId = notification?._id || notification?.id || Math.random();
                                const IconComponent = getNotificationIcon(notification?.type);
                                const isHovered = hoveredItemId === notificationId;
                                const isCurrentlyDeleting = deletingId === notificationId;

                                return (
                                    <div
                                        key={notificationId}
                                        onClick={(e) => !isCurrentlyDeleting && handleNotificationClick(notification, e)}
                                        onMouseEnter={() => !isCurrentlyDeleting && setHoveredItemId(notificationId)}
                                        onMouseLeave={() => setHoveredItemId(null)}
                                        className={`
                                            group flex items-start gap-3 px-4 py-3.5
                                            transition-colors duration-150 relative
                                            ${isCurrentlyDeleting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                            ${isUnread ? 'bg-gray-800/20' : 'bg-transparent'}
                                            animate-slide-in
                                        `}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        role="menuitem"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && !isCurrentlyDeleting && handleNotificationClick(notification, e)}
                                    >
                                        {isUnread && !isCurrentlyDeleting && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-md" />
                                        )}
                                        <div
                                            className={`
                                                mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center
                                                rounded-full ${isUnread ? 'bg-indigo-600/20' : 'bg-gray-600/20'}
                                            `}
                                        >
                                            {IconComponent}
                                        </div>
                                        <div className="flex-grow mr-16">
                                            <p className={`text-sm break-words font-medium ${isUnread ? 'text-white' : 'text-gray-300'} ${isHovered ? 'text-white' : ''}`}>
                                                {messageText}
                                            </p>
                                            <p className={`text-xs mt-1 tracking-tight ${isUnread ? 'text-blue-400' : 'text-gray-500'} ${isHovered ? 'text-blue-300' : ''}`}>
                                                {timeAgo}
                                            </p>
                                        </div>
                                        <div
                                            className={`
                                                absolute right-3 top-1/2 -translate-y-1/2
                                                flex items-center gap-1.5 w-16 h-8
                                                ${isHovered ? 'visible scale-100' : 'invisible scale-90'}
                                                transition-transform duration-150 ease-out
                                                pointer-events-${isHovered ? 'auto' : 'none'}
                                            `}
                                        >
                                            {isCurrentlyDeleting ? (
                                                <FaSpinner className="animate-spin text-red-400" size={14} />
                                            ) : (
                                                <>
                                                    {isUnread && (
                                                        <button
                                                            data-tooltip-id="notification-actions"
                                                            data-tooltip-content="Mark as read"
                                                            onClick={(e) => handleMarkOneRead(notification, e)}
                                                            className="p-1.5 rounded-full text-gray-400 hover:text-green-400 hover:bg-gray-700/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                                                            aria-label="Mark notification as read"
                                                        >
                                                            <FaCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        data-tooltip-id="notification-actions"
                                                        data-tooltip-content="Delete notification"
                                                        onClick={(e) => handleDeleteOne(notification, e)}
                                                        className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                                                        aria-label="Delete notification"
                                                    >
                                                        <FaTrashAlt size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Embedded CSS for animations and custom styles */}
            <style jsx>{`
                @keyframes slide-in {
                    0% { opacity: 0; transform: translateY(8px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
                /* Custom scrollbar */
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.8);
                    border-radius: 9999px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background-color: rgba(31, 41, 55, 0.3);
                }
            `}</style>
        </>
    );
};

export default NotificationDropdown;
