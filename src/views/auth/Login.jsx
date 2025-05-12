import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { AiOutlineGoogle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // Google and Eye icons
import { FaFacebookF } from "react-icons/fa";   // Facebook icon
import { PropagateLoader } from 'react-spinners'; // Loader component
import toast from 'react-hot-toast'; // Toast notifications
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks
import { overrideStyle } from '../../utils/utils'; // Style override for loader (ensure path is correct)
import { seller_login, messageClear } from '../../store/Reducers/authReducer'; // Redux actions

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get state from Redux store
    const { loader, errorMessage, successMessage } = useSelector(state => state.auth);

    // Component state for form inputs
    const [state, setState] = useState({
        email: "",
        password: ""
    });
    // State for password visibility toggle
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Handles changes in input fields
    const inputHandle = (e) => {
        setState({
            ...state,
            [e.target.name]: e.target.value
        });
    };

    // Handles form submission
    const submit = (e) => {
        e.preventDefault();
        // Basic frontend validation (optional but recommended)
        if (!state.email || !state.password) {
            toast.error("Please enter both email and password.");
            return;
        }
        dispatch(seller_login(state)); // Dispatch login action
    };

    // Effect to handle success/error messages and navigation
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(messageClear()); // Clear the message from Redux state
            navigate('/'); // Navigate to dashboard/home on successful login
        }
        if (errorMessage) {
            toast.error(errorMessage);
            dispatch(messageClear()); // Clear the message from Redux state
        }
        // Add dispatch and navigate to dependency array as they are used inside useEffect
    }, [successMessage, errorMessage, dispatch, navigate]);

    return (
        // Main container with gradient background
        <div className='min-w-screen min-h-screen bg-gradient-to-br from-[#0f4229] via-[#1b5e20] to-[#2e7d32] flex justify-center items-center py-8 px-4'>
            {/* Card container with max width for responsiveness */}
            <div className='w-full max-w-sm text-[#e3f2fd] p-4'> {/* Adjusted max-width */}
                {/* Card styling */}
                <div className='bg-[#1b5e20] p-6 rounded-lg shadow-xl border border-[#2e7d32]'>
                    <h2 className='text-2xl font-semibold text-center mb-3 text-white'>
                        Welcome To SOUG ELFALAH
                    </h2>
                    <p className='text-sm text-gray-300 text-center mb-6'> {/* Adjusted text color and margin */}
                        Please login to continue.
                    </p>

                    {/* Login Form */}
                    <form onSubmit={submit} noValidate>
                         {/* Disable inputs when loading */}
                         <fieldset disabled={loader} className="space-y-5"> {/* Added spacing */}
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="text-sm text-gray-300 block mb-1">Email</label>
                                <input
                                    id="email" name="email" type="email" required
                                    placeholder='Enter your email'
                                    value={state.email}
                                    onChange={inputHandle}
                                    // Consistent input styling
                                    className='w-full px-3 py-2 bg-transparent border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all'
                                />
                            </div>

                            {/* Password Input with Forgot Link and Visibility Toggle */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="text-sm text-gray-300">Password</label>
                                    <Link
                                        to="/forgot-password" // Link to the forgot password page
                                        className="text-xs text-yellow-400 hover:underline hover:text-yellow-300 transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                     <input
                                        id="password" name="password" required
                                        // Toggle type based on visibility state
                                        type={passwordVisible ? "text" : "password"}
                                        placeholder='Enter your password'
                                        value={state.password}
                                        onChange={inputHandle}
                                        className='w-full px-3 py-2 pr-10 bg-transparent border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all'
                                    />
                                    {/* Visibility Toggle Button */}
                                    <button
                                        type="button" // Important: type="button" to prevent form submission
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    >
                                        {passwordVisible ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                                    </button>
                                </div>
                            </div>
                         </fieldset>

                        {/* Login Button */}
                        <button
                            disabled={loader} // Disable button when loading
                            type="submit"
                            // Themed button styles
                            className={`mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2.5 rounded-md shadow-lg transition-all transform hover:scale-[1.02] flex justify-center items-center h-[44px] ${loader ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        >
                            {/* Show loader or text */}
                            {loader ? <PropagateLoader color='#333' cssOverride={overrideStyle} size={10} /> : 'Login'}
                        </button>

                        {/* Link to Registration Page */}
                        <div className='text-center mt-5'>
                            <p className='text-sm text-gray-300'> {/* Adjusted text color */}
                                Don't have an account? <Link to="/register" className="text-yellow-400 font-medium hover:underline">Sign up here</Link>
                            </p>
                        </div>

                        {/* "Or" Divider */}
                        <div className='w-full flex justify-center items-center my-5'> {/* Adjusted margin */}
                            <div className='w-[45%] bg-gray-600 h-[1px]'></div>
                            <span className='px-2 text-sm text-gray-400'>Or</span> {/* Adjusted text color */}
                            <div className='w-[45%] bg-gray-600 h-[1px]'></div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className='flex flex-col sm:flex-row justify-center items-center gap-3'>
                            {/* Google Button */}
                            <button type="button" className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 font-medium rounded-md shadow-md hover:bg-gray-200 transition-all transform hover:scale-105'>
                                <AiOutlineGoogle className="text-red-600 text-xl" />
                                <span>Google</span> {/* Simplified text */}
                            </button>

                            {/* Facebook Button */}
                            <button type="button" className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-md hover:bg-blue-700 transition-all transform hover:scale-105'>
                                <FaFacebookF className="text-white text-xl" />
                                <span>Facebook</span> {/* Simplified text */}
                            </button>
                        </div>

                    </form> {/* End of Form */}
                </div> {/* End of Card */}
            </div> {/* End of Card Container */}
        </div> // End of Main Container
    );
};

export default Login;