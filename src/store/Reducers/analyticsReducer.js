import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

export const get_seller_analytics_data = createAsyncThunk(
    'analytics/get_seller_analytics_data',
    async ({ sellerId, period }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/seller/analytics-data?sellerId=${sellerId}&period=${period}`, {
                withCredentials: true,
            });
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch analytics data' });
        }
    }
);

export const analyticsReducer = createSlice({
    name: 'analytics',
    initialState: {
        analyticsData: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(get_seller_analytics_data.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(get_seller_analytics_data.fulfilled, (state, { payload }) => {
                state.analyticsData = payload;
                state.loading = false;
            })
            .addCase(get_seller_analytics_data.rejected, (state, { payload }) => {
                state.error = payload.error;
                state.loading = false;
            });
    },
});

export const { clearError } = analyticsReducer.actions;
export default analyticsReducer.reducer;