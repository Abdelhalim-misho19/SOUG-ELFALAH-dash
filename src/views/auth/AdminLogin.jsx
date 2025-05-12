import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { admin_login, messageClear } from '../../store/Reducers/authReducer';
import { PropagateLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // Import eye icons

// Basic email validation function (optional but good practice)
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};


const AdminLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // Rename Redux errorMessage to avoid conflict with local validation errors
    const { loader, errorMessage: apiErrorMessage, successMessage } = useSelector(state => state.auth);

    const [state, setState] = useState({
        email: "",
        password: ""
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);

    // --- Input Handling ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setState(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear validation error for the field being typed in
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // --- Form Validation ---
    const validateForm = () => {
        const errors = {};
        if (!state.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!validateEmail(state.email)) { // Optional: Add email format validation
            errors.email = 'Invalid email format.';
        }
        if (!state.password) {
            errors.password = 'Password is required.';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0; // True if no errors
    };

    // --- Form Submission ---
    const submit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            dispatch(admin_login(state));
        } else {
             toast.error("Please fill in all required fields correctly.");
        }
    };

    // --- Loader Style ---
    // Defined directly where used or kept outside if more complex
    const overrideStyle = {
        display: 'flex',
        margin: '0 auto',
        height: '24px',
        justifyContent: 'center',
        alignItems: 'center'
    };

    // --- Effects for API Messages ---
    useEffect(() => {
        if (apiErrorMessage) {
            toast.error(apiErrorMessage);
            dispatch(messageClear());
             // If API returns field-specific errors, you could update validationErrors here
            // Example: if (typeof apiErrorMessage === 'object' && apiErrorMessage.email) {
            //    setValidationErrors(prev => ({ ...prev, email: apiErrorMessage.email }));
            // }
        }
        if (successMessage) {
            toast.success(successMessage);
            dispatch(messageClear());
            navigate('/'); // Navigate to admin dashboard on success
        }
    }, [apiErrorMessage, successMessage, dispatch, navigate]); // Added dependencies

    return (
        // Apply the gradient background
        <div className='min-w-screen min-h-screen bg-gradient-to-br from-[#0f4229] via-[#1b5e20] to-[#2e7d32] flex justify-center items-center py-8 px-4'>
             {/* Responsive card container */}
            <div className='w-full max-w-sm text-[#e3f2fd] p-4'> {/* max-w-sm for a smaller form */}
                {/* Apply card styling */}
                <div className='bg-[#1b5e20] p-6 rounded-lg shadow-xl border border-[#2e7d32]'>

                    {/* Logo Section */}
                    <div className='mb-6 flex justify-center items-center'>
                        <div className='w-[160px] h-auto'> {/* Adjusted logo size */}
                            {/* Recommended: Place logo in public folder or import it 
                            <img className='w-full h-full' src="/images/logo.png" alt="Logo" />*/}
                             {/* If using localhost: <img className='w-full h-full' src="http://localhost:3000/images/logo.png" alt="Logo" /> */}
                        </div>
                    </div>

                    <h2 className='text-xl font-semibold text-center mb-4 text-white'>
                        Admin Panel Login {/* Specific Title */}
                    </h2>

                    <form onSubmit={submit} noValidate>
                        <fieldset disabled={loader} className="space-y-5"> {/* Disable inputs during load, add space */}

                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="text-sm text-gray-300 block mb-1">Email</label>
                                <input
                                    onChange={handleInputChange}
                                    value={state.email}
                                    className={`w-full px-3 py-2 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                    type="email"
                                    name='email'
                                    placeholder='admin@example.com'
                                    id='email'
                                    required
                                    aria-invalid={!!validationErrors.email}
                                    aria-describedby="email-error"
                                />
                                {validationErrors.email && <p id="email-error" className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="text-sm text-gray-300 block mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        onChange={handleInputChange}
                                        value={state.password}
                                        className={`w-full px-3 py-2 pr-10 bg-transparent border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-500 focus:ring-yellow-500'}`}
                                        type={passwordVisible ? "text" : "password"}
                                        name='password'
                                        placeholder='Enter your password'
                                        id='password'
                                        required
                                        aria-invalid={!!validationErrors.password}
                                        aria-describedby="password-error"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    >
                                        {passwordVisible ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                                    </button>
                                </div>
                                {validationErrors.password && <p id="password-error" className="text-red-400 text-xs mt-1">{validationErrors.password}</p>}
                            </div>

                        </fieldset>

                        {/* Login Button */}
                        <button
                            disabled={loader} // Disable based on loader
                            type="submit"
                            className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Login'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;