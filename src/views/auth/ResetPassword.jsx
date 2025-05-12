import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle } from '../../utils/utils';
import { resetPassword, messageClear } from '../../store/Reducers/authReducer'; // Import new action
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useParams(); // Get token from URL
    const { loader, errorMessage, successMessage } = useSelector(state => state.auth);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Validation function
    const validateForm = useCallback(() => {
        const errors = {};
        if (!password) {
            errors.password = 'New password is required.';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters.';
        }
        // Add more complexity rules if desired

        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password.';
        } else if (password && password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [password, confirmPassword]);


    const submitReset = (e) => {
        e.preventDefault();
        if (validateForm()) {
            dispatch(resetPassword({ token, password, confirmPassword }));
        } else {
             toast.error("Please fix the errors in the form.");
        }
    };

    // Handle input changes and clear specific errors
    const handleInputChange = (e) => {
         const { name, value } = e.target;
         if (name === 'password') setPassword(value);
         if (name === 'confirmPassword') setConfirmPassword(value);

         if (validationErrors[name]) {
             setValidationErrors(prev => ({ ...prev, [name]: '' }));
         }
         // Re-validate confirmation if password changes
         if (name === 'password' && validationErrors.confirmPassword && value !== confirmPassword) {
             setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.'}));
         } else if (name === 'password' && validationErrors.confirmPassword) {
             setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
         }
    };


    useEffect(() => {
        // Display messages and navigate on success
        if (successMessage) {
            toast.success(successMessage);
            dispatch(messageClear());
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000); // 2 second delay
        }
        if (errorMessage) {
            toast.error(errorMessage);
            // If token is invalid/expired, maybe redirect?
            if (errorMessage.toLowerCase().includes("token is invalid or has expired")) {
                 setTimeout(() => {
                    navigate('/forgot-password'); // Send back to request new token
                 }, 2500);
            }
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, navigate]);

    useEffect(() => {
        // Clear messages if token changes (user navigates directly)
         dispatch(messageClear());
    }, [token, dispatch]);


    return (
        <div className='min-w-screen min-h-screen bg-gradient-to-br from-[#0f4229] via-[#1b5e20] to-[#2e7d32] flex justify-center items-center py-8 px-4'>
            <div className='w-full max-w-md text-[#e3f2fd] p-4'>
                <div className='bg-[#1b5e20] p-6 rounded-lg shadow-xl border border-[#2e7d32]'>
                    <h2 className='text-2xl font-semibold text-center mb-4 text-white'>
                        Reset Your Password
                    </h2>
                    <p className='text-sm text-gray-300 text-center mb-6'>
                        Enter and confirm your new password below.
                    </p>

                    <form onSubmit={submitReset} noValidate>
                         <fieldset disabled={loader} className="space-y-5">
                            {/* New Password Input */}
                            <div>
                                <label htmlFor="password" className="text-sm text-gray-300 block mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        id="password" name="password" required
                                        type={passwordVisible ? "text" : "password"}
                                        placeholder="Enter new password (min 8 chars)"
                                        value={password} onChange={handleInputChange}
                                        aria-invalid={!!validationErrors.password} aria-describedby="password-error"
                                        className={`w-full px-3 py-2 pr-10 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                    />
                                     <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer" aria-label={passwordVisible ? "Hide password" : "Show password"}>
                                        {passwordVisible ? <AiOutlineEyeInvisible size={20}/> : <AiOutlineEye size={20}/>}
                                    </button>
                                </div>
                                 {validationErrors.password && <p id="password-error" className="text-red-400 text-xs mt-1">{validationErrors.password}</p>}
                            </div>

                            {/* Confirm New Password Input */}
                             <div>
                                <label htmlFor="confirmPassword" className="text-sm text-gray-300 block mb-1">Confirm New Password</label>
                                 <div className="relative">
                                    <input
                                        id="confirmPassword" name="confirmPassword" required
                                        type={confirmVisible ? "text" : "password"}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword} onChange={handleInputChange}
                                        aria-invalid={!!validationErrors.confirmPassword} aria-describedby="confirmPassword-error"
                                        className={`w-full px-3 py-2 pr-10 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                    />
                                    <button type="button" onClick={() => setConfirmVisible(!confirmVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer" aria-label={confirmVisible ? "Hide password" : "Show password"}>
                                        {confirmVisible ? <AiOutlineEyeInvisible size={20}/> : <AiOutlineEye size={20}/>}
                                    </button>
                                </div>
                                {validationErrors.confirmPassword && <p id="confirmPassword-error" className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>}
                            </div>
                         </fieldset>

                         {/* Submit Button */}
                        <button
                            type="submit" disabled={loader}
                            className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        >
                            {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Reset Password'}
                        </button>
                    </form>

                    {/* Back to Login Link (Optional) */}
                    <div className='text-center mt-5'>
                         <p className='text-sm text-gray-300'>
                            Remembered it? <Link to="/login" className="text-yellow-400 font-medium hover:underline">Back to Login</Link>
                         </p>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;