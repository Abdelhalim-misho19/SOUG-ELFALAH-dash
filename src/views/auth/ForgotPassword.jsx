import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle } from '../../utils/utils';
import { requestPasswordReset, messageClear } from '../../store/Reducers/authReducer'; // Import new action

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { loader, errorMessage, successMessage } = useSelector(state => state.auth);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (emailToValidate) => {
         if (!emailToValidate) return 'Email is required.';
         const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
         if (!emailRegex.test(String(emailToValidate).toLowerCase())) {
             return 'Invalid email format.';
         }
         return ''; // No error
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (emailError) { // Clear error on change
            setEmailError('');
        }
    };

    const submitRequest = (e) => {
        e.preventDefault();
        const error = validateEmail(email);
        setEmailError(error);
        if (!error) {
            dispatch(requestPasswordReset({ email }));
        }
    };

    useEffect(() => {
        // Display messages from Redux state
        if (successMessage) {
            toast.success(successMessage); // Shows the generic success message from backend
            setEmail(''); // Clear email field on success
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage);
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch]);

    return (
         <div className='min-w-screen min-h-screen bg-gradient-to-br from-[#0f4229] via-[#1b5e20] to-[#2e7d32] flex justify-center items-center py-8 px-4'>
            <div className='w-full max-w-md text-[#e3f2fd] p-4'>
                <div className='bg-[#1b5e20] p-6 rounded-lg shadow-xl border border-[#2e7d32]'>
                    <h2 className='text-2xl font-semibold text-center mb-4 text-white'>
                        Forgot Your Password?
                    </h2>
                    <p className='text-sm text-gray-300 text-center mb-6'>
                        Enter your email address below, and we'll send you a link to reset your password if an account exists.
                    </p>

                    <form onSubmit={submitRequest} noValidate>
                         <fieldset disabled={loader} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="text-sm text-gray-300 block mb-1">Email Address</label>
                                <input
                                    id="email" name="email" type="email" required
                                    placeholder='Enter your registered email'
                                    value={email}
                                    onChange={handleEmailChange}
                                    aria-invalid={!!emailError}
                                    aria-describedby="email-error-fp"
                                    className={`w-full px-3 py-2 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                />
                                 {emailError && <p id="email-error-fp" className="text-red-400 text-xs mt-1">{emailError}</p>}
                            </div>
                         </fieldset>

                         {/* Submit Button */}
                        <button
                            type="submit" disabled={loader}
                            className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        >
                            {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Send Reset Link'}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className='text-center mt-5'>
                        <p className='text-sm text-gray-300'>
                            Remember your password? <Link to="/login" className="text-yellow-400 font-medium hover:underline">Back to Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;