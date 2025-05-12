// store/Reducers/dashboardReducer.js
// (Use the exact code from the previous "Full Codes" answer for Option 1)
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

// --- get_admin_dashboard_data Thunk (MODIFIED to accept period) ---
export const get_admin_dashboard_data = createAsyncThunk(
    'dashboard/get_admin_dashboard_data',
    // Accept an optional object with period, default to 'year' if not provided
    async ({ period = 'year' } = {}, { rejectWithValue, fulfillWithValue }) => {
        try {
            console.log(`Redux Thunk: Fetching admin dashboard data for period: ${period}`);
            // Add period as a query parameter to the API call
            const { data } = await api.get(`/admin/get-dashboard-data?period=${period}`, { withCredentials: true });
            // Assuming the backend returns the data structured as needed, including chartData
            return fulfillWithValue(data);
        } catch (error) {
            // Extract more specific error message if available
            const errorData = error.response?.data || { error: 'Failed to fetch admin dashboard data' };
            console.error('Admin dashboard fetch error in thunk:', errorData, error);
            return rejectWithValue(errorData); // Pass structured error data
        }
    }
);

// --- get_seller_dashboard_data Thunk (Keep as is) ---
export const get_seller_dashboard_data = createAsyncThunk(
    'dashboard/get_seller_dashboard_data',
    async (_, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get('/seller/get-dashboard-data', { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            console.error('Seller dashboard fetch error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch seller dashboard data' });
        }
    }
);

// --- get_seller_chart_data Thunk (Keep as is) ---
// This thunk remains separate for fetching seller-specific chart data on demand
export const get_seller_chart_data = createAsyncThunk(
    'dashboard/get_seller_chart_data',
    async ({ sellerId, period }, { rejectWithValue, fulfillWithValue }) => {
        try {
            // Basic validation (can be enhanced)
            if (!sellerId || typeof sellerId !== 'string') throw new Error('Invalid or missing sellerId');
            if (!['week', 'month', 'year'].includes(period)) throw new Error('Invalid period');

            console.log(`Redux Thunk: Fetching seller chart data for sellerId: ${sellerId}, period: ${period}`);
            const { data } = await api.get(`/seller/chart-data?sellerId=${sellerId}&period=${period}`, {
                withCredentials: true,
            });
            // Backend should return { orders: [], revenue: [], period: '...' }
            return fulfillWithValue(data);
        } catch (error) {
            const errorData = error.response?.data || { error: error.message || 'Failed to fetch chart data' };
            console.error('Seller chart data fetch error in thunk:', errorData, error);
            return rejectWithValue(errorData);
        }
    }
);


// --- Reducer Slice (MODIFIED initialState and fulfilled case for admin) ---
export const dashboardReducer = createSlice({
    name: 'dashboard',
    initialState: {
        // Admin specific state
        totalSale: 0,
        totalOrder: 0,
        totalProduct: 0,
        totalSeller: 0, // Represents active sellers usually
        totalPendingOrder: 0,
        totalPendingSellerRequests: 0,
        recentOrders: [], // Admin's view of recent orders
        recentMessages: [], // Admin's view of recent admin-seller messages
        recentSellerRequests: [], // Admin's view of recent pending sellers

        // Seller specific state (populated by get_seller_dashboard_data)
        // Using distinct names to avoid confusion if admin/seller use the same dashboard slice instance
        sellerTotalSale: 0,
        sellerTotalOrder: 0,
        sellerTotalProduct: 0,
        sellerTotalPendingOrder: 0,
        sellerRecentOrders: [],
        sellerRecentMessages: [], // Seller-customer messages
        sellerSaleChange: null,

        // Chart data (can be populated by admin or seller chart thunk)
        // For Admin: { sales: [], orders: [], sellers: [], period: '...' }
        // For Seller: { orders: [], revenue: [], period: '...' }
        chartData: null,

        // General loading/error state
        loading: false,
        error: null,

        // Legacy or unused state? Review if needed.
        // messages: [],
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        // Add other synchronous reducers if needed, e.g., clearChartData
        clearChartData: (state) => {
             state.chartData = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Admin Data Cases ---
            .addCase(get_admin_dashboard_data.pending, (state) => {
                state.loading = true;
                state.error = null; // Clear previous errors on new request
            })
            .addCase(get_admin_dashboard_data.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.totalSale = payload.totalSale || 0;
                state.totalOrder = payload.totalOrder || 0;
                state.totalProduct = payload.totalProduct || 0;
                state.totalSeller = payload.totalSeller || 0;
                state.totalPendingOrder = payload.totalPendingOrder || 0;
                state.totalPendingSellerRequests = payload.totalPendingSellerRequests || 0;
                state.recentOrders = payload.recentOrders || [];
                state.recentMessages = payload.recentMessages || []; // Admin-Seller messages
                state.recentSellerRequests = payload.recentSellerRequests || [];
                state.chartData = payload.chartData || null; // Store the chart object {sales, orders, sellers, period}
                state.error = null; // Clear error on success
            })
            .addCase(get_admin_dashboard_data.rejected, (state, { payload }) => {
                state.loading = false;
                // Use the error message from the backend rejection payload
                state.error = payload?.error || payload?.message || 'Failed to load admin dashboard data';
                // Optionally clear sensitive data on error
                state.chartData = null;
                // state.recentOrders = []; // etc.
            })

            // --- Seller Data Cases (Populates seller-specific state) ---
            .addCase(get_seller_dashboard_data.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(get_seller_dashboard_data.fulfilled, (state, { payload }) => {
                 state.loading = false;
                 // Populate seller-specific fields
                 state.sellerTotalSale = payload.totalSale || 0;
                 state.sellerTotalOrder = payload.totalOrder || 0;
                 state.sellerTotalProduct = payload.totalProduct || 0;
                 state.sellerTotalPendingOrder = payload.totalPendingOrder || 0;
                 state.sellerRecentOrders = payload.recentOrders || []; // Renamed from recentOrder
                 state.sellerRecentMessages = payload.messages || []; // Renamed from recentMessage
                 state.sellerSaleChange = payload.saleChange;
                 state.error = null;
                 // Note: This does NOT clear admin-specific data or chartData
            })
            .addCase(get_seller_dashboard_data.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload?.error || payload?.message || 'Failed to load seller dashboard data';
            })

            // --- Seller Chart Data Cases (Populates shared chartData state) ---
            .addCase(get_seller_chart_data.pending, (state) => {
                state.loading = true; // Or use a specific chartLoading state
                state.error = null;
            })
            .addCase(get_seller_chart_data.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.chartData = payload; // Contains { orders, revenue, period }
                state.error = null;
            })
            .addCase(get_seller_chart_data.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload?.error || 'Failed to load chart data';
                state.chartData = null; // Clear chart data on error
            });
    },
});

// Export actions including the new one if added
export const { clearError, clearChartData } = dashboardReducer.actions;
export default dashboardReducer.reducer;