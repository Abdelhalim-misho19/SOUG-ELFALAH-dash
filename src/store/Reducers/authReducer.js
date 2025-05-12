// store/Reducers/authReducer.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api"; // Ensure this path is correct
import { jwtDecode } from "jwt-decode";

// --- Helper Function to Decode Role from Token ---
const returnRole = (token) => {
    if (token) {
        try {
            const decodeToken = jwtDecode(token);
            const expireTime = new Date(decodeToken.exp * 1000);
            if (new Date() > expireTime) {
                localStorage.removeItem('accessToken'); // Clean up expired token
                console.warn("[returnRole] Token expired, removing.");
                return '';
            } else {
                return decodeToken.role || ''; // Return role or empty string if not present
            }
        } catch (error) {
             console.error("[returnRole] Error decoding token:", error);
             localStorage.removeItem('accessToken'); // Clean up invalid token
             return '';
        }
    } else {
        return ''; // No token, no role
    }
};


// --- Async Thunks ---

// LOGIN
export const admin_login = createAsyncThunk('auth/admin_login', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/admin-login', info, { withCredentials: true });
        localStorage.setItem('accessToken', data.token);
        return data; // { token, message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Login failed' }); }
});
export const seller_login = createAsyncThunk('auth/seller_login', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/seller-login', info, { withCredentials: true });
        localStorage.setItem('accessToken', data.token);
        return data; // { token, message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Login failed' }); }
});

// SELLER REGISTRATION (OTP Flow)
export const requestSellerOtp = createAsyncThunk('auth/requestSellerOtp', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/request-seller-otp', info, { withCredentials: true });
        return data; // { message, email }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'OTP Request failed' }); }
});
export const verifySellerOtp = createAsyncThunk('auth/verifySellerOtp', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/verify-seller-otp', info, { withCredentials: true });
        localStorage.setItem('accessToken', data.token); // Set token on verification success
        return data; // { token, message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'OTP Verification failed' }); }
});

// PASSWORD RESET
export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/request-password-reset', info, { withCredentials: true });
        return data; // { message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Password Reset Request failed' }); }
});
export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
        const { data } = await api.post(`/reset-password/${token}`, { password, confirmPassword }, { withCredentials: true });
        return data; // { message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Password Reset failed' }); }
});


// USER INFO & PROFILE
export const get_user_info = createAsyncThunk('auth/get_user_info', async (_, { rejectWithValue, getState }) => {
    if (!getState().auth.token) return rejectWithValue({ error: "Not authenticated" });
    try {
        const { data } = await api.get('/get-user', { withCredentials: true });
        return data; // { userInfo }
    } catch (error) {
        if (error.response?.status === 401) localStorage.removeItem('accessToken');
        return rejectWithValue(error.response?.data || { error: 'Fetch User Info failed' });
    }
});
export const profile_image_upload = createAsyncThunk('auth/profile_image_upload', async (formData, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/profile-image-upload', formData, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
        return data; // { userInfo, message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Image Upload failed' }); }
});
export const profile_info_add = createAsyncThunk('auth/profile_info_add', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/profile-info-add', info, { withCredentials: true });
        return data; // { userInfo, message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Profile Update failed' }); }
});
export const change_password = createAsyncThunk('auth/change_password', async (info, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/change-password', info, { withCredentials: true });
        return data; // { message }
    } catch (error) { return rejectWithValue(error.response?.data || { error: 'Password Change failed' }); }
});

// LOGOUT
export const logout = createAsyncThunk('auth/logout', async ({ navigate, role }, { fulfillWithValue }) => {
    try { await api.get('/logout', { withCredentials: true }); }
    catch (error) { console.error("Backend logout failed (proceeding):", error); }
    finally {
        localStorage.removeItem('accessToken');
        if (navigate && role) { role === 'admin' ? navigate('/admin/login') : navigate('/login'); }
        else { navigate('/login'); } // Default fallback
        return fulfillWithValue({ message: 'Logout successful' });
    }
});


// --- Redux Slice Definition ---
export const authReducer = createSlice({
    name: 'auth',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        userInfo: '',
        role: returnRole(localStorage.getItem('accessToken')),
        token: localStorage.getItem('accessToken') || null,
        // OTP state
        otpVerificationRequired: false,
        otpRequestEmail: null,
    },
    reducers: {
        messageClear: (state) => {
            state.errorMessage = "";
            state.successMessage = "";
        },
        resetOtpState: (state) => {
            state.otpVerificationRequired = false;
            state.otpRequestEmail = null;
            state.errorMessage = "";
            state.successMessage = "";
            state.loader = false;
        }
    },
    extraReducers: (builder) => {
        // Generic handler for pending state
        const handlePending = (state) => {
            state.loader = true;
            state.errorMessage = "";
            state.successMessage = "";
        };
        // Generic handler for rejected state
        const handleRejected = (state, { payload }) => {
            state.loader = false;
            state.errorMessage = payload?.error || payload?.message || 'An unexpected error occurred.'; // Use error or message from payload
        };

        // Build Cases
        builder
            // Login
            .addCase(admin_login.pending, handlePending)
            .addCase(admin_login.rejected, handleRejected)
            .addCase(admin_login.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; state.token = payload.token;
                state.role = returnRole(payload.token); state.otpVerificationRequired = false; state.otpRequestEmail = null;
            })
            .addCase(seller_login.pending, handlePending)
            .addCase(seller_login.rejected, handleRejected)
            .addCase(seller_login.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; state.token = payload.token;
                state.role = returnRole(payload.token); state.otpVerificationRequired = false; state.otpRequestEmail = null;
            })

            // OTP Request
            .addCase(requestSellerOtp.pending, handlePending)
            .addCase(requestSellerOtp.rejected, handleRejected)
            .addCase(requestSellerOtp.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message;
                state.otpVerificationRequired = true; state.otpRequestEmail = payload.email;
            })

            // OTP Verify
            .addCase(verifySellerOtp.pending, handlePending)
            .addCase(verifySellerOtp.rejected, (state, { payload }) => { // Keep OTP form visible on reject
                state.loader = false; state.errorMessage = payload?.error || payload?.message || 'OTP Verification Failed.';
            })
            .addCase(verifySellerOtp.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; state.token = payload.token;
                state.role = returnRole(payload.token); state.otpVerificationRequired = false; state.otpRequestEmail = null;
            })

            // Password Reset Request
            .addCase(requestPasswordReset.pending, handlePending)
            .addCase(requestPasswordReset.rejected, handleRejected)
            .addCase(requestPasswordReset.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; // Show generic success msg
            })

            // Password Reset Confirm
            .addCase(resetPassword.pending, handlePending)
            .addCase(resetPassword.rejected, handleRejected)
            .addCase(resetPassword.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message;
                // Don't log in, user must login with new password
            })


            // Get User Info
            .addCase(get_user_info.pending, (state) => { /* Optional: set specific loader */ })
            .addCase(get_user_info.rejected, (state, { payload }) => {
                // state.loader = false; // if specific loader was set
                state.errorMessage = payload?.error || 'Failed to get user info.';
                if (payload?.error === "Not authenticated") { // Clear invalid session
                    state.token = null; state.role = ''; state.userInfo = '';
                }
            })
            .addCase(get_user_info.fulfilled, (state, { payload }) => {
                 // state.loader = false; // if specific loader was set
                state.userInfo = payload.userInfo;
            })

            // Profile Updates
            .addCase(profile_image_upload.pending, handlePending)
            .addCase(profile_image_upload.rejected, handleRejected)
            .addCase(profile_image_upload.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; state.userInfo = payload.userInfo;
            })
            .addCase(profile_info_add.pending, handlePending)
            .addCase(profile_info_add.rejected, handleRejected)
            .addCase(profile_info_add.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message; state.userInfo = payload.userInfo;
            })
            .addCase(change_password.pending, handlePending)
            .addCase(change_password.rejected, handleRejected)
            .addCase(change_password.fulfilled, (state, { payload }) => {
                state.loader = false; state.successMessage = payload.message;
            })

            // Logout
             .addCase(logout.fulfilled, (state, { payload }) => {
                 state.loader = false; state.token = null; state.role = ''; state.userInfo = '';
                 state.successMessage = payload.message; state.errorMessage = '';
                 state.otpVerificationRequired = false; state.otpRequestEmail = null;
             });
    }
});

export const { messageClear, resetOtpState } = authReducer.actions;
export default authReducer.reducer;