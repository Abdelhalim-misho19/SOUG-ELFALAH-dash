import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getNav } from '../navigation/index';
import { BiLogOutCircle } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/Reducers/authReducer';
import logo from '../assets/logo2.png'; // Your logo path

const Sidebar = ({ showSidebar, setShowSidebar }) => {
    const dispatch = useDispatch();
    const { role } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [allNav, setAllNav] = useState([]);

    useEffect(() => {
        const navs = getNav(role);
        setAllNav(navs);
    }, [role]);

    const handleLogout = () => {
        dispatch(logout({ navigate, role }));
        setShowSidebar(false);
    };

    return (
        <>
            {/* Overlay for Mobile */}
            <div
                onClick={() => setShowSidebar(false)}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-[98] transition-opacity duration-300 ${
                    showSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                aria-hidden={!showSidebar}
            />

            {/* Sidebar Container */}
            <div
                className={`fixed top-0 left-0 w-[280px] h-screen bg-[#1e2337] z-[99] transition-transform duration-500 ease-in-out ${
                    showSidebar ? 'translate-x-0 shadow-xl shadow-black/30' : '-translate-x-full lg:translate-x-0'
                } overflow-hidden border-r border-gray-700/50`}
                role="navigation"
                aria-label="Main Navigation"
            >
                {/* Background Effects */}
                <div className="absolute inset-0 wave-bg opacity-[0.03] pointer-events-none" />
                <div className="absolute inset-0 particles pointer-events-none opacity-[0.05]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#252A40]/50 via-[#1e2337]/80 to-[#1e2337] pointer-events-none" />

                {/* Sidebar Content Structure */}
                <div className="relative z-10 h-full flex flex-col">

                    {/* --- Creative Logo Section --- */}
                    <div className="h-[80px] flex-shrink-0 flex justify-center items-center px-4 relative overflow-hidden border-b border-gray-700/50">
                        {/* Optional: Subtle gradient glow behind logo */}
                         <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

                        <Link to="/" onClick={() => setShowSidebar(false)} className="block outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md relative z-10 group">
                            <img
                                className="w-auto h-[210px] object-contain transition-all duration-300 ease-out group-hover:scale-105 filter brightness-110 group-hover:brightness-125"
                                src={logo}
                                alt="Dashboard Logo"
                            />
                             {/* Optional: Text or effect overlay on hover */}
                             {/* <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div> */}
                        </Link>
                    </div>
                    {/* --- End Creative Logo Section --- */}


                    {/* Navigation Links Container */}
                    <nav className="flex-grow overflow-y-auto py-7 px-4 custom-scrollbar" aria-label="Sidebar Navigation">
                        <ul className="space-y-3">
                            {allNav.map((nav, index) => {
                                const isActive = pathname === nav.path;
                                return (
                                    <li key={index}>
                                        <Link
                                            to={nav.path}
                                            onClick={() => setShowSidebar(false)}
                                            className={`relative flex items-center gap-4 px-4 py-3.5 rounded-lg text-base font-medium transition-all duration-200 ease-in-out group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2337] focus-visible:ring-cyan-400 ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-100 shadow-md border border-cyan-500/30'
                                                    : 'text-gray-400 hover:text-gray-100 hover:bg-[#303650]/50'
                                            }`}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            <span className={`text-xl flex-shrink-0 w-6 text-center ${isActive ? 'text-cyan-300' : 'text-gray-500 group-hover:text-cyan-300 transition-colors'}`}>
                                                {nav.icon}
                                            </span>
                                            <span className="tracking-wide">{nav.title}</span>
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(0,229,255,0.6)]"></span> // Added subtle shadow to indicator
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Logout Button Container */}
                    <div className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-gray-700/50">
                        <button
                            onClick={handleLogout}
                            className="w-full relative flex items-center gap-4 px-4 py-3.5 rounded-lg text-base font-medium text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 ease-in-out group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2337] focus-visible:ring-red-400"
                        >
                            <span className="text-xl flex-shrink-0 w-6 text-center text-gray-500 group-hover:text-red-400 transition-colors">
                                <BiLogOutCircle />
                            </span>
                            <span className="tracking-wide">Logout</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background Animation */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 25s ease-in-out infinite; }
                @keyframes waveAnimation { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                /* Particle Effect */
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.04) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px); background-size: 30px 30px, 55px 55px; background-position: 0 0, 27px 27px; animation: particleMove 35s linear infinite; }
                @keyframes particleMove { from{background-position:0 0, 27px 27px} to{background-position:300px 300px, 327px 327px} }

                /* --- Custom Scrollbar Styling --- */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent; /* Make track transparent */
                }
                /* --- Updated Thumb Color --- */
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, rgba(0, 229, 255, 0.5), rgba(168, 85, 247, 0.5)); /* Gradient thumb */
                    border-radius: 10px;
                    border: 1px solid rgba(128, 128, 128, 0.1); /* Optional subtle border */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, rgba(0, 229, 255, 0.7), rgba(168, 85, 247, 0.7)); /* Brighter gradient on hover */
                }
                /* Firefox Scrollbar Color */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    /* Firefox doesn't support gradient scrollbars well, use solid color */
                    scrollbar-color: rgba(0, 229, 255, 0.5) transparent; /* thumb track */
                }
            `}</style>
        </>
    );
};

export default Sidebar;