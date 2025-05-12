import { lazy } from "react";

// --- Existing Imports ---
const Login = lazy(() => import('../../views/auth/Login'));
const Register = lazy(() => import('../../views/auth/Register'));
const AdminLogin = lazy(() => import('../../views/auth/AdminLogin'));
const Home = lazy(() => import('../../views/Home'));
const UnAuthorized = lazy(() => import('../../views/UnAuthorized'));
const Success = lazy(() => import('../../views/Success')); // Keep Success if used for Stripe or other flows

// --- >> ADD IMPORTS FOR NEW COMPONENTS << ---
const ForgotPassword = lazy(() => import('../../views/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../../views/auth/ResetPassword'));
// --- >> END ADD IMPORTS << ---


const publicRoutes = [
    {
        path: '/',
        element : <Home/>,
    },
    {
        path : '/login',
        element : <Login/>
    },
    {
        path : '/register',
        element : <Register/>
    },
    {
        path : '/admin/login',
        element : <AdminLogin/>
    },
    // --- >> ADD NEW ROUTES FOR PASSWORD RESET << ---
    {
        path : '/forgot-password',
        element : <ForgotPassword />
    },
    {
        // The ':token' part makes 'token' a URL parameter
        path : '/reset-password/:token',
        element : <ResetPassword />
    },
    // --- >> END ADD NEW ROUTES << ---
    {
        path : '/unauthorized',
        element : <UnAuthorized/>
    },
    {
        // Note: '/success?' might not work as intended in react-router-dom v6 for optional params.
        // If '/success' is meant to catch stripe success, it's usually '/success'.
        // If it needs query parameters, react-router handles those separately.
        // Keeping it as is for now based on your original code.
        path : '/success?',
        element : <Success/>
    }
];

export default publicRoutes;