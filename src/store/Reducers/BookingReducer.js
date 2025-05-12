// src/store/Reducers/BookingReducer.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api"; // Your configured axios instance

// Thunk to get bookings for the logged-in seller
export const get_seller_bookings = createAsyncThunk(
    'booking/get_seller_bookings',
    async ({ parPage, page, searchValue, sellerId }, { rejectWithValue, fulfillWithValue }) => {
        try {
            // Ensure sellerId is included in the request
            if (!sellerId) {
                return rejectWithValue({ message: "Seller ID is required" });
            }
            const { data } = await api.get(`/bookings/seller/${sellerId}?page=${page}&searchValue=${searchValue}&parPage=${parPage}`, { withCredentials: true });
            console.log("get_seller_bookings response:", data);
            return fulfillWithValue(data); // Expects { bookings: [], totalBookings: number }
        } catch (error) {
            console.error("get_seller_bookings error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk to get details of a single booking
export const get_booking_details = createAsyncThunk(
    'booking/get_booking_details',
    async (bookingId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/bookings/${bookingId}`, { withCredentials: true });
            console.log("get_booking_details response:", data);
            return fulfillWithValue(data); // Expects { booking: {} }
        } catch (error) {
            console.error("get_booking_details error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk to update the status of a booking
export const update_booking_status = createAsyncThunk(
    'booking/update_booking_status',
    async ({ bookingId, status }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.put(`/bookings/status/${bookingId}`, { status }, { withCredentials: true });
             console.log("update_booking_status response:", data);
            return fulfillWithValue(data); // Expects { message: "...", booking: {} }
        } catch (error) {
            console.error("update_booking_status error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);


export const bookingReducer = createSlice({
    name: 'booking',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false, // Added loader state
        sellerBookings: [],
        currentBooking: {}, // For detail view
        totalBookings: 0, // For pagination
    },
    reducers: {
        messageClear: (state) => {
            state.errorMessage = "";
            state.successMessage = "";
        }
    },
    extraReducers: (builder) => {
        builder
            // Get Seller Bookings
            .addCase(get_seller_bookings.pending, (state) => {
                state.loader = true;
            })
            .addCase(get_seller_bookings.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.sellerBookings = payload.bookings;
                state.totalBookings = payload.totalBookings;
                state.errorMessage = ""; // Clear error on success
            })
            .addCase(get_seller_bookings.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.message || "Failed to fetch bookings";
                state.sellerBookings = [];
                state.totalBookings = 0;
            })

            // Get Booking Details
            .addCase(get_booking_details.pending, (state) => {
                state.loader = true;
            })
            .addCase(get_booking_details.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.currentBooking = payload.booking;
                state.errorMessage = "";
            })
            .addCase(get_booking_details.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.message || "Failed to fetch booking details";
                state.currentBooking = {};
            })

            // Update Booking Status
            .addCase(update_booking_status.pending, (state) => {
                state.loader = true; // You might want a specific loader for the update action
            })
            .addCase(update_booking_status.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                // Update the status in the list if it exists
                const index = state.sellerBookings.findIndex(b => b._id === payload.booking._id);
                if (index !== -1) {
                    state.sellerBookings[index].status = payload.booking.status;
                }
                 // Update the current booking if it's the one being viewed
                if (state.currentBooking._id === payload.booking._id) {
                    state.currentBooking.status = payload.booking.status;
                }
                state.errorMessage = "";
            })
            .addCase(update_booking_status.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.message || "Failed to update booking status";
                state.successMessage = "";
            });
    }
});

export const { messageClear } = bookingReducer.actions;
export default bookingReducer.reducer;