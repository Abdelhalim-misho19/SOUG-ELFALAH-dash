// store/Reducers/serviceCategoryReducer.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

// Async Thunks
export const serviceCategoryAdd = createAsyncThunk(
    'serviceCategory/serviceCategoryAdd',
    async ({ name, image }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('image', image);
            const { data } = await api.post('/service-category-add', formData, { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const get_serviceCategory = createAsyncThunk(
    'serviceCategory/get_serviceCategory',
    async ({ parPage, page, searchValue }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/service-category-get?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateServiceCategory = createAsyncThunk(
    'serviceCategory/updateServiceCategory',
    async ({ id, name, image }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (image) {
                formData.append('image', image);
            }
            const { data } = await api.put(`/service-category-update/${id}`, formData, { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteServiceCategory = createAsyncThunk(
    'serviceCategory/deleteServiceCategory',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/service-category/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Slice
const serviceCategoryReducer = createSlice({
    name: 'serviceCategory',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        serviceCategories: [],
        totalServiceCategory: 0
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = "";
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(serviceCategoryAdd.pending, (state) => {
                state.loader = true;
            })
            .addCase(serviceCategoryAdd.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                state.serviceCategories = [...state.serviceCategories, payload.serviceCategory];
            })
            .addCase(serviceCategoryAdd.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(get_serviceCategory.fulfilled, (state, { payload }) => {
                state.totalServiceCategory = payload.totalServiceCategory;
                state.serviceCategories = payload.serviceCategories;
            })
            .addCase(updateServiceCategory.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                const index = state.serviceCategories.findIndex(cat => cat._id === payload.serviceCategory._id);
                if (index !== -1) {
                    state.serviceCategories[index] = payload.serviceCategory;
                }
            })
            .addCase(updateServiceCategory.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(deleteServiceCategory.fulfilled, (state, action) => {
                state.serviceCategories = state.serviceCategories.filter(cat => cat._id !== action.meta.arg);
                state.successMessage = action.payload.message;
            })
            .addCase(deleteServiceCategory.rejected, (state, action) => {
                state.errorMessage = action.payload;
            });
    }
});

export const { messageClear } = serviceCategoryReducer.actions;
export default serviceCategoryReducer.reducer;
