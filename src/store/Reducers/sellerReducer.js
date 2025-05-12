import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const get_seller_request = createAsyncThunk(
    'seller/get_seller_request',
    async({ parPage, page, searchValue }, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.get(`/request-seller-get?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, {withCredentials: true});
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const get_seller = createAsyncThunk(
    'seller/get_seller',
    async(sellerId, {rejectWithValue, fulfillWithValue}) => {
        try {
            // --- MODIFICATION START ---
            // Assuming your backend route is /get-seller/:sellerId
            // If it's different (e.g., /seller/:sellerId), change it here to match EXACTLY.
            const {data} = await api.get(`/get-seller/${sellerId}`, {withCredentials: true});
            // --- MODIFICATION END ---
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Error fetching seller:", error.response?.data || error.message); // Added logging
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch seller details' });
        }
    }
);

export const seller_status_update = createAsyncThunk(
    'seller/seller_status_update',
    async(info, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.post(`/seller-status-update`, info, {withCredentials: true});
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const get_active_sellers = createAsyncThunk(
    'seller/get_active_sellers',
    async({ parPage, page, searchValue }, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.get(`/get-sellers?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, {withCredentials: true});
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const get_deactive_sellers = createAsyncThunk(
    'seller/get_deactive_sellers',
    async({ parPage, page, searchValue }, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.get(`/get-deactive-sellers?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, {withCredentials: true});
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const create_stripe_connect_account = createAsyncThunk(
    'seller/create_stripe_connect_account',
    async() => {
        try {
            const {data: {url}} = await api.get(`/payment/create-stripe-connect-account`, {withCredentials: true});
            window.location.href = url;
        } catch (error) {
            console.log(error.response.data);
            // Consider dispatching an error message here as well
        }
    }
);

export const active_stripe_connect_account = createAsyncThunk(
    'seller/active_stripe_connect_account',
    async(activeCode, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.put(`/payment/active-stripe-connect-account/${activeCode}`, {}, {withCredentials: true});
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const sellerReducer = createSlice({
    name: 'seller',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        sellers: [],
        totalSeller: 0,
        // --- MODIFICATION START ---
        // Initialize seller as null or undefined for clearer loading checks
        seller: null,
        // --- MODIFICATION END ---
        isLoadingSeller: false // Added specific loading state for fetching single seller
    },
    reducers: {
        messageClear: (state, _) => {
            state.successMessage = "";
            state.errorMessage = "";
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(get_seller_request.fulfilled, (state, { payload }) => {
                state.sellers = payload.sellers;
                state.totalSeller = payload.totalSeller;
            })
             // --- MODIFICATION START ---
            .addCase(get_seller.pending, (state) => {
                state.isLoadingSeller = true; // Set loading true when fetch starts
            })
            .addCase(get_seller.fulfilled, (state, { payload }) => {
                state.isLoadingSeller = false; // Set loading false on success
                state.seller = payload.seller; // Update seller data
            })
            .addCase(get_seller.rejected, (state, { payload }) => {
                state.isLoadingSeller = false; // Set loading false on failure
                state.seller = null; // Reset seller data on failure
                state.errorMessage = payload?.message || 'Failed to load seller details'; // Show error
            })
             // --- MODIFICATION END ---
            .addCase(seller_status_update.fulfilled, (state, { payload }) => {
                // Update the seller in state only if the update was successful
                if (payload.seller) {
                   state.seller = payload.seller;
                }
                state.successMessage = payload.message;
                 // Optionally update the seller in the 'sellers' array if it exists
                 const index = state.sellers.findIndex(s => s._id === payload.seller?._id);
                 if (index !== -1) {
                     state.sellers[index] = payload.seller;
                 }
            })
            .addCase(seller_status_update.rejected, (state, { payload }) => {
                 state.errorMessage = payload?.message || 'Failed to update status';
            })
            .addCase(get_active_sellers.fulfilled, (state, { payload }) => {
                state.sellers = payload.sellers;
                state.totalSeller = payload.totalSeller;
            })
            .addCase(get_deactive_sellers.fulfilled, (state, { payload }) => {
                state.sellers = payload.sellers;
                state.totalSeller = payload.totalSeller;
            })
            .addCase(active_stripe_connect_account.pending, (state) => {
                state.loader = true;
            })
            .addCase(active_stripe_connect_account.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.message || 'Failed to activate Stripe account';
            })
            .addCase(active_stripe_connect_account.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                 // If the current seller detail view is for the user activating stripe, update their payment status
                if (state.seller?._id === payload.sellerId) { // Assuming payload includes sellerId
                    state.seller.payment = 'active'; // Or update based on actual payload structure
                }
            });
    }
});

export const { messageClear } = sellerReducer.actions;
export default sellerReducer.reducer;