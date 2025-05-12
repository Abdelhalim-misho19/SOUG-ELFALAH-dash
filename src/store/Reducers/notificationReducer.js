import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async ({ page = 1, parPage = 50 }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/notifications?page=${page}&parPage=${parPage}`, { withCredentials: true });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch notifications' });
        }
    }
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/notifications/unread-count', { withCredentials: true });
            return data.unreadCount;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch unread count' });
        }
    }
);

// Mark notification as read
export const markNotificationReadAPI = createAsyncThunk(
    'notifications/markNotificationReadAPI',
    async (notificationId, { rejectWithValue }) => {
        try {
            const { data } = await api.patch(`/notifications/${notificationId}/read`, {}, { withCredentials: true });
            return { notificationId, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to mark notification as read' });
        }
    }
);

// Mark all notifications as read
export const markAllNotificationsReadAPI = createAsyncThunk(
    'notifications/markAllNotificationsReadAPI',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.patch('/notifications/read-all', {}, { withCredentials: true });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to mark all notifications as read' });
        }
    }
);

// Clear all notifications
export const clearAllNotificationsAPI = createAsyncThunk(
    'notifications/clearAllNotificationsAPI',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.delete('/notifications/clear-all', { withCredentials: true });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to clear all notifications' });
        }
    }
);

// Delete a specific notification
export const deleteNotificationAPI = createAsyncThunk(
    'notifications/deleteNotificationAPI',
    async (notificationId, { rejectWithValue }) => {
        try {
            const { data } = await api.delete(`/notifications/${notificationId}`, { withCredentials: true });
            return { notificationId, ...data };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to delete notification' });
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        isDropdownOpen: false,
    },
    reducers: {
        toggleNotificationDropdown: (state) => {
            state.isDropdownOpen = !state.isDropdownOpen;
        },
        openNotificationDropdown: (state) => {
            state.isDropdownOpen = true;
        },
        closeNotificationDropdown: (state) => {
            state.isDropdownOpen = false;
        },
        clearNotificationError: (state) => {
            state.error = null;
        },
        updateUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
                state.notifications = payload.notifications || [];
                state.unreadCount = payload.totalNotifications
                    ? payload.notifications.filter(n => n.status === 'unread').length
                    : 0;
                state.loading = false;
            })
            .addCase(fetchNotifications.rejected, (state, { payload }) => {
                state.error = payload.message;
                state.loading = false;
            })
            // Fetch Unread Count
            .addCase(fetchUnreadCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUnreadCount.fulfilled, (state, { payload }) => {
                state.unreadCount = payload;
                state.loading = false;
            })
            .addCase(fetchUnreadCount.rejected, (state, { payload }) => {
                state.error = payload.message;
                state.loading = false;
            })
            // Mark Notification Read
            .addCase(markNotificationReadAPI.fulfilled, (state, { payload }) => {
                const { notificationId } = payload;
                const notification = state.notifications.find(n => n._id === notificationId);
                if (notification) {
                    notification.status = 'read';
                    notification.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            // Mark All Read
            .addCase(markAllNotificationsReadAPI.fulfilled, (state) => {
                state.notifications = state.notifications.map(n => ({
                    ...n,
                    status: 'read',
                    read: true,
                }));
                state.unreadCount = 0;
            })
            // Clear All Notifications
            .addCase(clearAllNotificationsAPI.fulfilled, (state) => {
                state.notifications = [];
                state.unreadCount = 0;
            })
            // Delete Notification
            .addCase(deleteNotificationAPI.fulfilled, (state, { payload }) => {
                const { notificationId } = payload;
                const deletedNotification = state.notifications.find(n => n._id === notificationId);
                state.notifications = state.notifications.filter(n => n._id !== notificationId);
                if (deletedNotification && deletedNotification.status === 'unread') {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            });
    },
});

export const {
    toggleNotificationDropdown,
    openNotificationDropdown,
    closeNotificationDropdown,
    clearNotificationError,
    updateUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;