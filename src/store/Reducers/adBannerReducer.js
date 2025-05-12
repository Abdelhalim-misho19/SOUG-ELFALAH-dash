// store/Reducers/adBannerReducer.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

// --- Async Thunks for API Calls ---

export const add_ad_banner = createAsyncThunk(
    'adBanner/add_ad_banner',
    async (formData, { rejectWithValue, fulfillWithValue }) => {
        try {
            // Use 'Content-Type': 'multipart/form-data' implicitly handled by browser/axios with FormData
            const { data } = await api.post('/admin/ad-banner/add', formData, {
                withCredentials: true
            });
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Add Ad Banner Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'An error occurred' });
        }
    }
);

export const get_admin_ad_banners = createAsyncThunk(
    'adBanner/get_admin_ad_banners',
    async (_, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get('/admin/ad-banners', { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Get Admin Ad Banners Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'An error occurred' });
        }
    }
);

export const get_active_ad_banners = createAsyncThunk(
    'adBanner/get_active_ad_banners',
    async (_, { rejectWithValue, fulfillWithValue }) => {
        try {
            // No credentials needed for public route usually
            const { data } = await api.get('/ad-banners/active');
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Get Active Ad Banners Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'An error occurred' });
        }
    }
);


export const update_ad_banner = createAsyncThunk(
    'adBanner/update_ad_banner',
    async ({ adBannerId, formData }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.put(`/admin/ad-banner/update/${adBannerId}`, formData, {
                withCredentials: true
            });
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Update Ad Banner Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'An error occurred' });
        }
    }
);

export const delete_ad_banner = createAsyncThunk(
    'adBanner/delete_ad_banner',
    async (adBannerId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.delete(`/admin/ad-banner/delete/${adBannerId}`, {
                withCredentials: true
            });
            // Pass the original ID on success for easier state update
            return fulfillWithValue({ ...data, adBannerId });
        } catch (error) {
            console.error("Delete Ad Banner Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'An error occurred' });
        }
    }
);


// --- Slice Definition ---

export const adBannerSlice = createSlice({
    name: 'adBanner',
    initialState: {
        loading: false,
        successMessage: '',
        errorMessage: '',
        adBanners: [], // List for admin management
        activeAdBanners: [], // List for public display
        // currentAdBanner: null // Optional: for editing state
    },
    reducers: {
        messageClear: (state) => {
            state.successMessage = "";
            state.errorMessage = "";
        }
    },
    extraReducers: (builder) => {
        builder
            // Add Ad Banner
            .addCase(add_ad_banner.pending, (state) => {
                state.loading = true;
            })
            .addCase(add_ad_banner.rejected, (state, { payload }) => {
                state.loading = false;
                state.errorMessage = payload?.error || 'Failed to add ad banner';
            })
            .addCase(add_ad_banner.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.successMessage = payload.message;
                // Add the new banner to the beginning of the admin list
                state.adBanners = [payload.adBanner, ...state.adBanners];
            })

            // Get Admin Ad Banners
            .addCase(get_admin_ad_banners.pending, (state) => {
                state.loading = true;
            })
            .addCase(get_admin_ad_banners.rejected, (state, { payload }) => {
                state.loading = false;
                state.errorMessage = payload?.error || 'Failed to fetch admin ad banners';
                state.adBanners = [];
            })
            .addCase(get_admin_ad_banners.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.adBanners = payload.adBanners;
            })

            // Get Active Ad Banners
            .addCase(get_active_ad_banners.pending, (state) => {
                 // Potentially use a different loading state if needed for public vs admin loading
                 // state.publicLoading = true;
            })
            .addCase(get_active_ad_banners.rejected, (state, { payload }) => {
                // state.publicLoading = false;
                // state.publicErrorMessage = payload?.error || 'Failed to fetch active banners';
                state.activeAdBanners = [];
            })
            .addCase(get_active_ad_banners.fulfilled, (state, { payload }) => {
                // state.publicLoading = false;
                state.activeAdBanners = payload.activeAdBanners;
            })

            // Update Ad Banner
            .addCase(update_ad_banner.pending, (state) => {
                state.loading = true;
            })
            .addCase(update_ad_banner.rejected, (state, { payload }) => {
                state.loading = false;
                state.errorMessage = payload?.error || 'Failed to update ad banner';
            })
            .addCase(update_ad_banner.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.successMessage = payload.message;
                // Find and update the banner in the admin list
                const index = state.adBanners.findIndex(b => b._id === payload.adBanner._id);
                if (index !== -1) {
                    state.adBanners[index] = payload.adBanner;
                }
            })

             // Delete Ad Banner
            .addCase(delete_ad_banner.pending, (state) => {
                state.loading = true;
            })
            .addCase(delete_ad_banner.rejected, (state, { payload }) => {
                state.loading = false;
                state.errorMessage = payload?.error || 'Failed to delete ad banner';
            })
            .addCase(delete_ad_banner.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.successMessage = payload.message;
                // Remove the banner from the admin list using the ID passed back
                state.adBanners = state.adBanners.filter(b => b._id !== payload.adBannerId);
            });
    }
});

export const { messageClear } = adBannerSlice.actions;
export default adBannerSlice.reducer;