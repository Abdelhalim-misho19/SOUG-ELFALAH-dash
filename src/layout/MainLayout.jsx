import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Assuming Header is in the same directory
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory
// Keep NotificationDropdown if it's a separate overlay/component triggered elsewhere
import NotificationDropdown from '../views/components/NotificationDropdown';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { updateUnreadCount } from '../store/Reducers/notificationReducer'; // Adjust path if needed
import { updateCustomer, updateSellers } from '../store/Reducers/chatReducer'; // Adjust path if needed

// Moved socket URL to a constant for easier configuration
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const MainLayout = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.auth);
    const [showSidebar, setShowSidebar] = useState(false); // State for mobile sidebar visibility
    const socket = useRef(null); // Ref to hold the socket instance

    // --- Socket Connection and Event Handling ---
    useEffect(() => {
        // Only proceed if user info is available
        if (!userInfo?._id) {
            // If user logs out or info is missing, disconnect existing socket
            if (socket.current?.connected) {
                console.log('Layout: User logged out or info missing, disconnecting socket.');
                socket.current.disconnect();
                socket.current = null;
            }
            return; // Exit effect if no user info
        }

        // Initialize socket connection if it doesn't exist or is disconnected
        if (!socket.current || !socket.current.connected) {
            console.log(`Layout: Attempting to connect socket to ${SOCKET_SERVER_URL}...`);
            // Clean up any previous instance before creating a new one
            if (socket.current) {
                 socket.current.disconnect();
            }

            // Establish connection with query for initial identification
            socket.current = io(SOCKET_SERVER_URL, {
                query: { userId: userInfo._id, role: userInfo.role }, // Send ID and role on connection
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
                transports: ['websocket'], // Prefer websocket
            });

            // --- Socket Event Listeners ---
            socket.current.on('connect', () => {
                console.log('Layout: Socket connected successfully. ID:', socket.current.id);
                // No need to emit 'add_seller'/'add_admin' if using query identification
                // Server can handle joining rooms based on the query data
            });

            socket.current.on('disconnect', (reason) => {
                console.log('Layout: Socket disconnected. Reason:', reason);
                // Handle specific disconnect reasons if needed (e.g., 'io server disconnect')
                if (reason === 'io server disconnect') {
                     // Potentially force logout or show persistent error message
                     toast.error("Disconnected by server.", { duration: 5000 });
                }
            });

            socket.current.on('connect_error', (error) => {
                console.error('Layout: Socket connection error:', error.message);
                // Avoid spamming toasts on repeated connection attempts
                // Consider showing a persistent connection status indicator instead
                 toast.error(`Connection Error: ${error.message}`, { id: 'socket-conn-error', duration: 5000 });
            });

             // Listen for active seller list updates (presumably for admin)
             socket.current.on('activeSeller', (activeSellers) => {
                 // console.log('Layout: Received activeSeller update:', activeSellers);
                 dispatch(updateSellers(activeSellers));
             });
             // Add listener for active customers if needed (for seller)
             // socket.current.on('activeCustomer', (activeCustomers) => {
             //    dispatch(updateCustomer(activeCustomers));
             // });

            // Notification listeners (same handler for admin/seller)
            socket.current.on('new_notification', (notificationData) => {
                console.log(`Layout: Received new_notification:`, notificationData);
                // Show more specific toast
                toast.success(notificationData.message || 'You have a new notification!', {
                     duration: 5000, id: notificationData._id // Use ID to prevent duplicates if resent
                });
                // Update unread count in Redux store
                dispatch(updateUnreadCount(notificationData.unreadCount ?? 1)); // Use ?? for fallback
            });

            socket.current.on('unread_count_update', ({ unreadCount }) => {
                // console.log(`Layout: Received unread_count_update:`, unreadCount);
                dispatch(updateUnreadCount(unreadCount));
            });

            console.log(`Layout: Socket listeners initialized for user: ${userInfo._id}, role: ${userInfo.role}`);
        }

        // --- Cleanup function ---
        // Runs when component unmounts or dependencies change
        return () => {
            console.log('Layout: Cleanup effect running. Current socket:', socket.current?.id);
            if (socket.current) {
                 console.log('Layout: Disconnecting socket and removing listeners during cleanup.');
                 // Remove specific listeners before disconnecting
                 socket.current.off('connect');
                 socket.current.off('disconnect');
                 socket.current.off('connect_error');
                 socket.current.off('activeSeller');
                 // socket.current.off('activeCustomer'); // If added
                 socket.current.off('new_notification');
                 socket.current.off('unread_count_update');
                 socket.current.disconnect();
                 socket.current = null; // Clear the ref
            }
        };
        // Re-run effect if userInfo._id changes (e.g., login/logout)
    }, [userInfo?._id, userInfo?.role, dispatch]); // Use specific fields from userInfo


    return (
        // Base layout styling matching the dark theme
        <div className="w-full min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background effects (optional) */}
            {/* <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" /> */}
            {/* <div className="absolute inset-0 particles pointer-events-none opacity-50" /> */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" /> */}

            {/* Sidebar Component */}
            <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />

             {/* Main Content Area */}
             {/* Apply left margin matching sidebar width on large screens */}
             {/* Apply top padding matching header height */}
             {/* Use transition for smooth sidebar open/close effect */}
             <div className={`ml-0 lg:ml-[280px] pt-[80px] transition-all duration-500 ease-in-out`}>
                 {/* Header Component */}
                <Header showSidebar={showSidebar} setShowSidebar={setShowSidebar} />

                 {/* Outlet for rendering nested routes */}
                 <main className="p-4 md:p-6 lg:p-8"> {/* Add padding around content */}
                     <Outlet />
                 </main>

                {/* Footer (Optional) */}
                {/* <footer className="text-center py-4 text-xs text-gray-500"> Your Footer Content </footer> */}
            </div>

            {/* Notification Dropdown (if it's an overlay triggered by Header's bell icon) */}
            {/* It might be better placed within the Header component itself */}
             {userInfo && (userInfo.role === 'admin' || userInfo.role === 'seller') && <NotificationDropdown />} 

            {/* Removed embedded style block as background is handled by Tailwind */}
        </div>
    );
};

export default MainLayout;