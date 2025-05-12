import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineGoogle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaFacebookF } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { PropagateLoader } from 'react-spinners';
// Assuming overrideStyle is defined correctly in utils
import { overrideStyle } from '../../utils/utils';
// Import correct actions and thunks
import { requestSellerOtp, verifySellerOtp, messageClear, resetOtpState } from '../../store/Reducers/authReducer';
import toast from 'react-hot-toast';

// --- Helper functions ---
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};
const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
};
// --- End Helper Functions ---

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get state including OTP flags from Redux
    const {
        loader,
        successMessage,
        errorMessage: apiErrorMessage, // Renamed from Redux state
        otpVerificationRequired,      // Flag to show OTP form
        otpRequestEmail               // Email used for OTP request
    } = useSelector(state => state.auth);

    // State for registration form fields
    const [state, setState] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // State for the OTP input field
    const [otpValue, setOtpValue] = useState("");

    // Other existing state variables
    const [agreed, setAgreed] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // --- Input Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setState(prevState => ({ ...prevState, [name]: value }));

        // Clear validation error for the field being typed in
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Live validation (optional)
        if (name === 'email') {
             if (value && !validateEmail(value)) { setValidationErrors(prev => ({ ...prev, email: 'Invalid email format.' })); } else { setValidationErrors(prev => ({ ...prev, email: '' })); }
        } else if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
            if (value && value.length < 8) { setValidationErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters.' })); } else { setValidationErrors(prev => ({ ...prev, password: '' })); }
            // Re-validate confirm password if password changes
            if (state.confirmPassword && value !== state.confirmPassword) {
                 setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
            } else if (validationErrors.confirmPassword) {
                 setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        } else if (name === 'confirmPassword') {
             if (state.password && value && state.password !== value) { setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' })); }
             else { setValidationErrors(prev => ({ ...prev, confirmPassword: '' })); }
        } else if (name === 'name') {
             if (!value.trim()) { setValidationErrors(prev => ({ ...prev, name: 'Name cannot be empty.' })); } else { setValidationErrors(prev => ({ ...prev, name: '' })); }
        }
    };

    const handleCheckboxChange = (e) => {
        setAgreed(e.target.checked);
        if (e.target.checked && validationErrors.agreement) {
            setValidationErrors(prev => ({ ...prev, agreement: '' }));
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
        if (value.length <= 6) {
            setOtpValue(value);
            if (validationErrors.otp) { // Clear OTP specific error on change
                setValidationErrors(prev => ({ ...prev, otp: '' }));
            }
        }
    };

    // --- Form Validation ---
    const validateRegForm = useCallback(() => {
        const errors = {};
        if (!state.name.trim()) errors.name = 'Name is required.';
        if (!state.email) { errors.email = 'Email is required.'; }
        else if (!validateEmail(state.email)) { errors.email = 'Invalid email format.'; }
        if (!state.password) { errors.password = 'Password is required.'; }
        else if (state.password.length < 8) { errors.password = 'Password must be at least 8 characters.'; }
        if (!state.confirmPassword) { errors.confirmPassword = 'Please confirm your password.'; }
        else if (state.password !== state.confirmPassword) { errors.confirmPassword = 'Passwords do not match.'; }
        if (!agreed) errors.agreement = 'You must agree to the terms.';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [state.name, state.email, state.password, state.confirmPassword, agreed]);

     const validateOtpForm = useCallback(() => {
         const errors = {};
         if (!otpValue || otpValue.length !== 6) {
             errors.otp = 'Please enter the 6-digit OTP.';
         }
         setValidationErrors(errors); // Overwrite previous errors with OTP errors
         return Object.keys(errors).length === 0;
     }, [otpValue]);

    // --- Form Submission Handlers ---
    const submitRegistration = (e) => {
        e.preventDefault();
        // Clear previous errors before validating again
        setValidationErrors({});
        if (validateRegForm()) {
            const { name, email, password } = state;
            dispatch(requestSellerOtp({ name, email, password }));
        } else {
            toast.error("Please correct the errors in the form.");
        }
    };

    const submitOtpVerification = (e) => {
         e.preventDefault();
         // Clear previous errors before validating again
         setValidationErrors({});
         if (validateOtpForm()) {
             if (!otpRequestEmail) {
                 toast.error("Verification session expired or invalid. Please start registration again.");
                 dispatch(resetOtpState()); // Reset state if email is missing
                 return;
             }
             dispatch(verifySellerOtp({ email: otpRequestEmail, otp: otpValue }));
         } else {
              // Error toast is handled by the validation itself setting errors
              // toast.error("Please enter a valid 6-digit OTP.");
         }
    };

    // --- Effects ---
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
             // Navigate only on *final* success (OTP verified, token received)
             const token = localStorage.getItem('accessToken');
            if (!otpVerificationRequired && token) {
                 navigate('/'); // Redirect after successful OTP verification
             }
            dispatch(messageClear());
        }
        if (apiErrorMessage) {
            // If the error is a string, show it directly
            if (typeof apiErrorMessage === 'string') {
                toast.error(apiErrorMessage);
            }
            // If the error is an object (potentially field-specific), set validation errors
            else if (typeof apiErrorMessage === 'object' && apiErrorMessage !== null && apiErrorMessage.error) {
                 toast.error(apiErrorMessage.error); // Show general error from API
                 // Optionally handle field specific errors if backend sends them structured
                 // e.g., if (apiErrorMessage.details?.otp) setValidationErrors(prev => ({...prev, otp: apiErrorMessage.details.otp }))
            } else {
                 toast.error("An unknown error occurred."); // Fallback
            }

            dispatch(messageClear());
        }
    }, [successMessage, apiErrorMessage, dispatch, navigate, otpVerificationRequired]);

    // Cleanup effect: Reset OTP state if user navigates away while OTP form is shown
    useEffect(() => {
        return () => {
             dispatch(messageClear()); // Clear messages on unmount
            if (otpVerificationRequired) {
                dispatch(resetOtpState());
            }
        };
    }, [dispatch, otpVerificationRequired]); // Re-run only if otpVerificationRequired changes

    // --- Password Strength Visual ---
    const getStrengthColor = (level) => {
        switch (level) {
            case 0: return 'bg-transparent';
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-lime-500';
            case 5: return 'bg-green-500';
            default: return 'bg-gray-600';
        }
    };
    const renderPasswordStrength = () => {
         if (!state.password) return null;
         return (
            <div className="w-full h-2 rounded-full bg-gray-600 mt-1 overflow-hidden" aria-label="Password strength indicator">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={passwordStrength}
                    aria-valuemin="0"
                    aria-valuemax="5"
                ></div>
            </div>
         );
    };
    // --- End Password Strength Visual ---

    return (
        <div className='min-w-screen min-h-screen bg-gradient-to-br from-[#0f4229] via-[#1b5e20] to-[#2e7d32] flex justify-center items-center py-8 px-4'>
            <div className='w-full max-w-md text-[#e3f2fd] p-4'> {/* Consistent max-width */}
                <div className='bg-[#1b5e20] p-6 rounded-lg shadow-xl border border-[#2e7d32]'>

                    {/* --- Conditional Rendering: Registration Form or OTP Form --- */}
                    {!otpVerificationRequired ? (
                        <>
                            {/* --- Registration Form --- */}
                             <h2 className='text-2xl font-semibold text-center mb-3 text-white'>
                                Create Your Seller Account
                            </h2>
                            <p className='text-sm text-gray-300 text-center mb-6'>
                                Fill in the details below. Verification required.
                            </p>
                            <form onSubmit={submitRegistration} noValidate>
                                <fieldset disabled={loader} className="space-y-4">
                                    {/* --- Name Input --- */}
                                    <div>
                                        <label htmlFor="name" className="text-sm text-gray-300 block mb-1">Name</label>
                                        <input
                                            id="name" name="name" type="text" required
                                            placeholder="Enter your full name"
                                            value={state.name} onChange={handleInputChange}
                                            aria-invalid={!!validationErrors.name} aria-describedby="name-error"
                                            className={`w-full px-3 py-2 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                        />
                                        {validationErrors.name && <p id="name-error" className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
                                    </div>
                                    {/* --- Email Input --- */}
                                     <div>
                                        <label htmlFor="email" className="text-sm text-gray-300 block mb-1">Email</label>
                                        <input
                                            id="email" name="email" type="email" required
                                            placeholder="Enter your email address"
                                            value={state.email} onChange={handleInputChange}
                                            aria-invalid={!!validationErrors.email} aria-describedby="email-error"
                                            className={`w-full px-3 py-2 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                         />
                                        {validationErrors.email && <p id="email-error" className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                                    </div>
                                     {/* --- Password Input --- */}
                                    <div>
                                        <label htmlFor="password" className="text-sm text-gray-300 block mb-1">Password</label>
                                        <div className="relative">
                                            <input
                                                id="password" name="password" required
                                                type={passwordVisible ? "text" : "password"}
                                                placeholder="Create a strong password (min 8 chars)"
                                                value={state.password} onChange={handleInputChange}
                                                aria-invalid={!!validationErrors.password} aria-describedby="password-error password-strength"
                                                className={`w-full px-3 py-2 pr-10 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                            />
                                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer" aria-label={passwordVisible ? "Hide password" : "Show password"}>
                                                {passwordVisible ? <AiOutlineEyeInvisible size={20}/> : <AiOutlineEye size={20}/>}
                                            </button>
                                        </div>
                                        {renderPasswordStrength()}
                                        {validationErrors.password && <p id="password-error" className="text-red-400 text-xs mt-1">{validationErrors.password}</p>}
                                        <span id="password-strength" className="sr-only">Password strength indicator</span>
                                    </div>
                                    {/* --- Confirm Password Input --- */}
                                    <div>
                                        <label htmlFor="confirmPassword" className="text-sm text-gray-300 block mb-1">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                id="confirmPassword" name="confirmPassword" required
                                                type={confirmPasswordVisible ? "text" : "password"}
                                                placeholder="Re-enter your password"
                                                value={state.confirmPassword} onChange={handleInputChange}
                                                 aria-invalid={!!validationErrors.confirmPassword} aria-describedby="confirmPassword-error"
                                                className={`w-full px-3 py-2 pr-10 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                             />
                                            <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer" aria-label={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}>
                                                {confirmPasswordVisible ? <AiOutlineEyeInvisible size={20}/> : <AiOutlineEye size={20}/>}
                                            </button>
                                        </div>
                                        {validationErrors.confirmPassword && <p id="confirmPassword-error" className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>}
                                    </div>
                                    {/* --- Agreement Checkbox --- */}
                                     <div className='pt-2'>
                                        <div className="flex items-start gap-3">
                                            <input
                                                id="checkbox" name="checkbox" type="checkbox" required
                                                checked={agreed} onChange={handleCheckboxChange}
                                                aria-invalid={!!validationErrors.agreement} aria-describedby="agreement-error"
                                                className={`mt-1 w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-600 focus:ring-offset-gray-800 focus:ring-2 cursor-pointer ${validationErrors.agreement ? 'border-red-500 ring-red-500' : ''}`}
                                             />
                                            <div className="flex-1">
                                                <label htmlFor="checkbox" className='text-sm text-gray-300 cursor-pointer'>I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className='text-yellow-400 hover:underline'>Privacy Policy</a> & <a href="/terms" target="_blank" rel="noopener noreferrer" className='text-yellow-400 hover:underline'>Terms of Service</a>.</label>
                                                {validationErrors.agreement && <p id="agreement-error" className="text-red-400 text-xs mt-1">{validationErrors.agreement}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* --- Submit Registration Button --- */}
                                <button
                                    type="submit" disabled={loader}
                                    className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                >
                                    {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Register & Get OTP'}
                                </button>
                            </form>
                            {/* --- Sign In Link --- */}
                             <div className='text-center mt-5'>
                                <p className='text-sm text-gray-300'>
                                    Already have an account? <Link to="/login" className="text-yellow-400 font-medium hover:underline">Sign In here</Link>
                                </p>
                            </div>
                             {/* --- Social Buttons (Optional) --- */}
                             <div className='w-full flex justify-center items-center my-5'>
                                <div className='w-[45%] bg-gray-600 h-[1px]'></div>
                                <div className='w-auto px-2 flex justify-center items-center'>
                                    <span className='text-sm text-gray-400'>Or</span>
                                </div>
                                <div className='w-[45%] bg-gray-600 h-[1px] '></div>
                            </div>
                            <div className='flex flex-col sm:flex-row justify-center items-center gap-3'>
                                <button type="button" className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 font-medium rounded-md shadow-md hover:bg-gray-200 transition-all transform hover:scale-105'>
                                    <AiOutlineGoogle className="text-red-600 text-xl" />
                                    <span>Google</span>
                                </button>
                                <button type="button" className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-md hover:bg-blue-700 transition-all transform hover:scale-105'>
                                    <FaFacebookF className="text-white text-xl" />
                                    <span>Facebook</span>
                                </button>
                            </div>
                             {/* --- End Social Buttons --- */}
                        </>
                    ) : (
                        <>
                            {/* --- OTP Verification Form --- */}
                             <h2 className='text-2xl font-semibold text-center mb-3 text-white'>
                                Verify Your Email
                            </h2>
                             <p className='text-sm text-gray-300 text-center mb-6'>
                                An OTP has been sent to <b className="text-yellow-300 break-all">{otpRequestEmail || 'your email'}</b>.
                                Check your inbox (and spam folder).
                             </p>
                             <form onSubmit={submitOtpVerification} noValidate>
                                <fieldset disabled={loader} className="space-y-4">
                                    <div>
                                        <label htmlFor="otp" className="text-sm text-gray-300 block mb-1">Enter 6-Digit OTP</label>
                                        <input
                                            id="otp" name="otp" type="text" inputMode='numeric' required
                                            maxLength={6}
                                            placeholder='123456'
                                            value={otpValue} onChange={handleOtpChange}
                                            autoComplete="one-time-code" // Helps with auto-fill
                                            aria-invalid={!!validationErrors.otp} aria-describedby="otp-error"
                                            className={`w-full px-3 py-2 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all tracking-[8px] text-center text-lg font-semibold ${validationErrors.otp ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                        />
                                        {validationErrors.otp && <p id="otp-error" className="text-red-400 text-xs mt-1">{validationErrors.otp}</p>}
                                    </div>
                                    {/* --- Optional: Resend OTP Link/Button Here --- */}
                                     {/* Example: <button type="button" onClick={handleResendOtp} disabled={resendDisabled || loader} className="...">Resend OTP</button> */}
                                </fieldset>

                                {/* --- Verify Button --- */}
                                <button
                                    type="submit" disabled={loader}
                                    className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                >
                                    {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Verify Account'}
                                </button>
                            </form>
                            {/* --- Go Back Option --- */}
                             <div className='text-center mt-4'>
                                 <button
                                     onClick={() => dispatch(resetOtpState())}
                                     className="text-sm text-yellow-400 hover:underline disabled:opacity-50 cursor-pointer"
                                     disabled={loader}
                                     type="button" // Ensure it's not treated as submit
                                 >
                                     Entered wrong email? Go Back
                                 </button>
                             </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;