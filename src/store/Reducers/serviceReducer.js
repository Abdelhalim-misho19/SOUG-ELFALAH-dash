import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

// --- Add Service Thunk ---
export const add_service = createAsyncThunk(
    'service/add_service',
    async (serviceFormData, { rejectWithValue, fulfillWithValue }) => { // Expect FormData
        try {
            // Send FormData for adding service (handles file uploads)
            const { data } = await api.post('/service-add', serviceFormData, {
                withCredentials: true,
                // Axios handles Content-Type for FormData automatically
            });
            return fulfillWithValue(data); // Expect { message, service? }
        } catch (error) {
            console.error("Add service error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to add service' });
        }
    }
);

// --- Get Multiple Services Thunk ---
export const get_services = createAsyncThunk(
    'service/get_services',
    async ({ parPage, page, searchValue }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get('/services-get', {
                params: { page, parPage, searchValue },
                withCredentials: true
            });
            // Expect data structure: { services: [...], totalService: number }
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Get services error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch services' });
        }
    }
);

// --- Get Single Service Thunk ---
export const get_service = createAsyncThunk(
    'service/get_service',
    async (serviceId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/service-get/${serviceId}`, { withCredentials: true });
            // Expect data structure: { service: {...} }
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Get single service error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch service details' });
        }
    }
);

// --- Update Service Thunk ---
export const update_service = createAsyncThunk(
    'service/update_service',
    // Changed from 'formData' to 'serviceData' to reflect JSON payload
    async ({ serviceId, serviceData }, { rejectWithValue, fulfillWithValue }) => {
        try {
            // Send serviceData as JSON for update (no file uploads)
            const { data } = await api.put(`/service-update/${serviceId}`, serviceData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            // Expect data structure: { message, service: {...} } // Service is the updated one
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Update service error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to update service' });
        }
    }
);

// --- Delete Service Thunk ---
export const delete_service = createAsyncThunk(
    'service/delete_service',
    async (serviceId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.delete(`/service-delete/${serviceId}`, { withCredentials: true });
            // Expect data structure: { message, serviceId } // Return the ID for frontend removal
            return fulfillWithValue(data);
        } catch (error) {
            console.error("Delete service error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || { error: 'Failed to delete service' });
        }
    }
);

// --- Service Slice Definition ---
const serviceSlice = createSlice({
    name: 'service',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,          // General loader for add/update/delete
        listLoader: false,      // Specific loader for fetching list (get_services)
        detailsLoader: false,   // Specific loader for fetching details (get_service)
        services: [],           // Array of services for listing
        service: null,          // Holds single service details, initialize as null
        totalService: 0         // Total count for pagination
    },
    reducers: {
        // Clears success/error messages
        messageClear: (state) => {
            state.errorMessage = "";
            state.successMessage = "";
        },
        // Clears the single service details (e.g., when leaving edit page)
        clearSingleService: (state) => {
            state.service = null;
            state.detailsLoader = false; // Optionally reset loader too
            state.errorMessage = ""; // Clear errors related to fetching details
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Add Service Cases ---
            .addCase(add_service.pending, (state) => {
                state.loader = true; // Use general loader
                state.errorMessage = "";
                state.successMessage = "";
            })
            .addCase(add_service.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.error || 'Failed to add service';
            })
            .addCase(add_service.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                // Optional: Add to list if needed without refetching
                // if (payload.service) {
                //     state.services.push(payload.service);
                //     state.totalService += 1;
                // }
            })

            // --- Get Services (List) Cases ---
            .addCase(get_services.pending, (state) => {
                state.listLoader = true; // Use list loader
                state.errorMessage = "";
            })
            .addCase(get_services.rejected, (state, { payload }) => {
                state.listLoader = false;
                state.errorMessage = payload?.error || "Failed to fetch services";
                state.services = [];
                state.totalService = 0;
            })
            .addCase(get_services.fulfilled, (state, { payload }) => {
                state.listLoader = false;
                state.services = payload.services || []; // Default to empty array
                state.totalService = payload.totalService || 0; // Default to 0
            })

            // --- Get Single Service Cases ---
            .addCase(get_service.pending, (state) => {
                state.detailsLoader = true; // Use details loader
                state.service = null;
                state.errorMessage = "";
            })
            .addCase(get_service.rejected, (state, { payload }) => {
                state.detailsLoader = false;
                state.errorMessage = payload?.error || "Failed to fetch service details";
                state.service = null;
            })
            .addCase(get_service.fulfilled, (state, { payload }) => {
                state.detailsLoader = false;
                // Expect payload like { service: {...} }
                state.service = payload.service || null;
            })

            // --- Update Service Cases ---
            .addCase(update_service.pending, (state) => {
                state.loader = true; // Use general loader
                state.errorMessage = "";
                state.successMessage = "";
            })
            .addCase(update_service.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.error || "Failed to update service";
            })
            .addCase(update_service.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                // Update the service in the 'services' list if it exists and data is returned
                if (payload.service) {
                    state.services = state.services.map(s =>
                        s._id === payload.service._id ? payload.service : s
                    );
                }
                // Clear single service view after update? Or rely on navigation?
                // state.service = null;
            })

            // --- Delete Service Cases ---
            .addCase(delete_service.pending, (state) => {
                state.loader = true; // Use general loader
                state.errorMessage = "";
                state.successMessage = "";
            })
            .addCase(delete_service.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.error || "Failed to delete service";
            })
            .addCase(delete_service.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                // Remove the deleted service from the list using the ID from payload
                if (payload.serviceId) {
                    const initialLength = state.services.length;
                    state.services = state.services.filter(s => s._id !== payload.serviceId);
                    // Only decrement total if an item was actually removed from the current list
                    if (state.services.length < initialLength) {
                        state.totalService = Math.max(0, state.totalService - 1); // Prevent negative total
                    }
                }
                // If the deleted service was the one being viewed, clear it
                if (state.service?._id === payload.serviceId) {
                    state.service = null;
                }
            });
    }
});

// Export actions and reducer
export const { messageClear, clearSingleService } = serviceSlice.actions;
export default serviceSlice.reducer;