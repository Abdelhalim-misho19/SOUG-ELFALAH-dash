import React, { useEffect, useState, useCallback, useRef } from 'react';
// --- CORRECTED ICON IMPORTS ---
import {
    FaImages,
    FaEdit, // Using FaEdit as replacement for FaPenToSquare
    FaSpinner,
    FaStripe,
    // FaXmark is imported from fa6 below
    FaUserCircle,
    FaSave,
    FaCheckCircle,
    FaHourglassHalf,
    FaTimesCircle,
    FaIdCard,
    FaStore,
    FaLock
} from "react-icons/fa"; // Import general FA icons

// Import specific FA6 icons needed
import { FaXmark } from "react-icons/fa6"; // Import FaXmark from fa6

// --- END ICON IMPORTS ---

import { BeatLoader } from 'react-spinners'; // Consistent loader
import { useDispatch, useSelector } from 'react-redux';
import { profile_image_upload, messageClear, profile_info_add, change_password } from '../../store/Reducers/authReducer'; // Adjust path
import toast from 'react-hot-toast';
import { create_stripe_connect_account } from '../../store/Reducers/sellerReducer'; // Adjust path

// --- Helper: InfoDisplay Component ---
// ... (InfoDisplay component remains the same)
const InfoDisplay = ({ label, value, icon }) => (
    <div className="flex items-start py-1.5">
        {icon && React.createElement(icon, { className: "text-gray-400 w-4 h-4 flex-shrink-0 mr-2 mt-0.5" })}
        <span className="text-sm font-medium text-gray-400 w-[100px] sm:w-[120px] shrink-0">{label}:</span>
        <span className='text-sm text-gray-200 break-words'>
            {value || <span className="italic text-gray-500">Not Provided</span>}
        </span>
    </div>
);

const Profile = () => {
    // --- State Hooks ---
    const [shopInfoState, setShopInfoState] = useState({ division: '', district: '', shopName: '', sub_district: '', eccp: '' });
    const [isEditingShopInfo, setIsEditingShopInfo] = useState(false);
    // Add confirm_password to state
    const [passwordData, setPasswordData] = useState({ email: "", old_password: "", new_password: "", confirm_password: "" });
    const imageInputRef = useRef(null);

    // --- Redux Hooks ---
    const dispatch = useDispatch();
    const { userInfo, loader: authLoader, successMessage, errorMessage } = useSelector(state => state.auth);
    const { loader: stripeLoader } = useSelector(state => state.seller);

    // --- Helper Functions ---
    const resetShopInfoForm = useCallback((currentUserInfo) => {
        setShopInfoState({
            shopName: currentUserInfo?.shopInfo?.shopName || '',
            division: currentUserInfo?.shopInfo?.division || '',
            district: currentUserInfo?.shopInfo?.district || '',
            sub_district: currentUserInfo?.shopInfo?.sub_district || '',
            eccp: currentUserInfo?.shopInfo?.eccp || ''
        });
    }, []);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/images/user_placeholder.png'; // Default placeholder path
    };

    // --- Effects ---
    useEffect(() => {
        if (userInfo) {
            resetShopInfoForm(userInfo);
            setPasswordData(prevState => ({ ...prevState, email: userInfo.email || '' }));
            if (!userInfo.shopInfo || Object.keys(userInfo.shopInfo).length === 0 || !userInfo.shopInfo.shopName) {
                setIsEditingShopInfo(true);
            } else {
                setIsEditingShopInfo(false);
            }
        }
    }, [userInfo, resetShopInfoForm]);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            if (successMessage.includes('Profile Info')) { setIsEditingShopInfo(false); }
            // Reset password fields including confirm_password on success
            if (successMessage.includes('Password changed')) {
                 setPasswordData({ email: userInfo?.email || '', old_password: '', new_password: '', confirm_password: '' });
            }
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, userInfo?.email]);

    // --- Event Handlers ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);
            dispatch(profile_image_upload(formData));
        }
        if(imageInputRef.current) imageInputRef.current.value = null;
    };

    const handleShopInfoInput = (e) => {
        setShopInfoState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleShopInfoSubmit = (e) => {
        e.preventDefault();
        if (!shopInfoState.shopName || !shopInfoState.division || !shopInfoState.district || !shopInfoState.sub_district) {
            toast.error("Please fill in all required shop fields (*).");
            return;
        }
        dispatch(profile_info_add(shopInfoState));
    };

    const handleCancelShopInfoEdit = () => {
        setIsEditingShopInfo(false);
        resetShopInfoForm(userInfo);
    };

    const handlePasswordInput = (e) => {
        setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChangeSubmit = (e) => {
        e.preventDefault();
        const { old_password, new_password, confirm_password } = passwordData;

        // --- Frontend Validation ---
        if (!old_password || !new_password || !confirm_password) {
            toast.error("Please fill all password fields.");
            return;
        }
        if (new_password.length < 8) { // Consistent length check
            toast.error("New password must be at least 8 characters.");
            return;
        }
        if (new_password !== confirm_password) {
            toast.error("New passwords do not match.");
            return;
        }
        if (old_password === new_password) {
            toast.error("New password cannot be the same as the old password.");
            return;
        }
        // --- End Frontend Validation ---

        // Dispatch the full passwordData object
        dispatch(change_password(passwordData));
    };

    const handleStripeConnect = () => {
        if (stripeLoader) return;
        dispatch(create_stripe_connect_account());
    };

    const isActionLoading = authLoader || stripeLoader;
    const sellerAvatar = userInfo?.image || '/images/user_placeholder.png';

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* ... (Background Effects) ... */}
             {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />


            <div className="relative z-10 max-w-6xl mx-auto">
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight mb-8'>My Profile</h1>

                <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8'>

                     {/* Left Column: Profile Info & Password */}
                     <div className='lg:col-span-5'>
                        {/* ... (Profile Header & Account Details remain the same) ... */}
                         <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg mb-6 lg:mb-8'>
                            {/* Profile Header */}
                            <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-5 border-b border-gray-700/50 mb-5'>
                                <label htmlFor="img" className='relative group cursor-pointer flex-shrink-0'>
                                    <img className='w-24 h-24 rounded-full object-cover border-4 border-cyan-500/40 shadow-md group-hover:border-cyan-400/80 transition-all duration-300' src={sellerAvatar} alt={userInfo?.name || 'Seller'} onError={handleImageError} />
                                     <div className='absolute inset-0 bg-black/50 rounded-full flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                        {authLoader && !stripeLoader ? <BeatLoader color="#ffffff" size={8} /> : <FaEdit className="text-white text-xl" />} {/* Use FaEdit */}
                                    </div>
                                </label>
                                <input ref={imageInputRef} onChange={handleImageUpload} type="file" className='hidden' id='img' name="profileImage" accept="image/png, image/jpeg, image/webp" />
                                <div className='text-center sm:text-left'>
                                    <h2 className='text-xl font-semibold text-gray-100 break-words'>{userInfo?.name || 'Seller Name'}</h2>
                                    <p className='text-sm text-gray-400 break-words'>{userInfo?.email || 'seller@example.com'}</p>
                                    <p className='text-xs uppercase tracking-wider text-purple-400 mt-1 font-medium'>{userInfo?.role || 'Role'}</p>
                                </div>
                            </div>
                            {/* Account Details */}
                             <div className='space-y-3 text-sm'>
                                 <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2"><FaIdCard /> Account Status</h3>
                                 <div className='flex justify-between items-center pl-6'>
                                     <span className='text-gray-400'>Account:</span>
                                     <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${ userInfo?.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : userInfo?.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                                         {userInfo?.status === 'active' ? <FaCheckCircle size={10}/> : userInfo?.status === 'pending' ? <FaHourglassHalf size={10}/> : <FaTimesCircle size={10}/>}
                                         {userInfo?.status || 'N/A'}
                                     </span>
                                 </div>
                                 <div className='flex justify-between items-center pl-6'>
                                     <span className='text-gray-400'>Payment:</span>
                                     <span>
                                         {userInfo?.payment === 'active' ? (
                                             <span className='px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-medium border border-emerald-500/30 inline-flex items-center gap-1.5'><FaStripe /> Active</span>
                                         ) : (
                                             <button onClick={handleStripeConnect} disabled={stripeLoader} className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5'>
                                                 {stripeLoader ? <BeatLoader color="#ffffff" size={6}/> : <><FaStripe /> Connect Stripe</>}
                                             </button>
                                         )}
                                     </span>
                                 </div>
                            </div>
                        </div>


                        {/* Change Password Panel */}
                        <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                            <h2 className='text-lg font-semibold text-gray-100 pb-3 border-b border-gray-700/50 mb-5 flex items-center gap-2'><FaLock /> Change Password</h2>
                            <form onSubmit={handlePasswordChangeSubmit}>
                                <div className='space-y-4'>
                                    {/* Email (Read Only) */}
                                    <div>
                                        <label htmlFor="emailPass" className='block text-sm font-medium text-gray-400 mb-1.5'>Email</label>
                                        <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/50 border-gray-600 text-gray-500 cursor-not-allowed' type="email" id='emailPass' value={passwordData.email} readOnly />
                                    </div>
                                    {/* Current Password */}
                                    <div>
                                        <label htmlFor="old_password" className='block text-sm font-medium text-gray-400 mb-1.5'>Current Password <span className="text-rose-500">*</span></label>
                                        <input className='w-full px-4 py-2.5 border rounded-lg outline-none transition-all text-sm bg-[#303650]/80 border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-200 placeholder-gray-500' type="password" name='old_password' id='old_password' value={passwordData.old_password} onChange={handlePasswordInput} placeholder='Enter current password' required />
                                    </div>
                                    {/* New Password */}
                                    <div>
                                        <label htmlFor="new_password" className='block text-sm font-medium text-gray-400 mb-1.5'>New Password <span className="text-rose-500">*</span></label>
                                        <input className='w-full px-4 py-2.5 border rounded-lg outline-none transition-all text-sm bg-[#303650]/80 border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-200 placeholder-gray-500' type="password" name='new_password' id='new_password' value={passwordData.new_password} onChange={handlePasswordInput} placeholder='Enter new password (min. 8)' required />
                                    </div>
                                    {/* --- ADD CONFIRM PASSWORD FIELD --- */}
                                    <div>
                                        <label htmlFor="confirm_password" className='block text-sm font-medium text-gray-400 mb-1.5'>Confirm New Password <span className="text-rose-500">*</span></label>
                                        <input className='w-full px-4 py-2.5 border rounded-lg outline-none transition-all text-sm bg-[#303650]/80 border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-200 placeholder-gray-500' type="password" name='confirm_password' id='confirm_password' value={passwordData.confirm_password} onChange={handlePasswordInput} placeholder='Confirm your new password' required />
                                    </div>
                                    {/* --- END CONFIRM PASSWORD FIELD --- */}
                                    <button type="submit" disabled={authLoader} className={`w-full sm:w-auto bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all shadow-md flex items-center justify-center gap-2 ${authLoader ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/30'}`}>
                                        {authLoader ? <BeatLoader color="#ffffff" size={8}/> : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                     </div>

                    {/* Right Column: Shop Info */}
                     <div className='lg:col-span-7'>
                        {/* ... (Shop Info Section remains the same) ... */}
                         <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-700/50">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2"><FaStore /> Shop Information</h2>
                                {userInfo?.shopInfo && !isEditingShopInfo && (
                                    <button onClick={() => setIsEditingShopInfo(true)} className='p-2 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md transition-all duration-200' aria-label="Edit Shop Information"> <FaEdit size={14} /> </button>
                                )}
                            </div>

                            {isEditingShopInfo ? (
                                // --- Edit Form ---
                                <form onSubmit={handleShopInfoSubmit}>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <div>
                                            <label htmlFor="shopName" className='block text-sm font-medium text-gray-300 mb-1.5'>Shop Name <span className="text-rose-500">*</span></label>
                                            <input value={shopInfoState.shopName} onChange={handleShopInfoInput} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' type="text" name='shopName' id='shopName' placeholder='Your Shop Name' required />
                                        </div>
                                         <div>
                                            <label htmlFor="division" className='block text-sm font-medium text-gray-300 mb-1.5'>Division <span className="text-rose-500">*</span></label>
                                            <input value={shopInfoState.division} onChange={handleShopInfoInput} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' type="text" name='division' id='division' placeholder='e.g., Dhaka' required />
                                        </div>
                                        <div>
                                            <label htmlFor="district" className='block text-sm font-medium text-gray-300 mb-1.5'>District <span className="text-rose-500">*</span></label>
                                            <input value={shopInfoState.district} onChange={handleShopInfoInput} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' type="text" name='district' id='district' placeholder='e.g., Gazipur' required />
                                        </div>
                                        <div>
                                            <label htmlFor="sub_district" className='block text-sm font-medium text-gray-300 mb-1.5'>Sub District / Area <span className="text-rose-500">*</span></label>
                                            <input value={shopInfoState.sub_district} onChange={handleShopInfoInput} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' type="text" name='sub_district' id='sub_district' placeholder='e.g., Kaliakoir' required />
                                        </div>
                                        <div className='sm:col-span-2'>
                                            <label htmlFor="eccp" className='block text-sm font-medium text-gray-300 mb-1.5'>ECCP <span className="text-gray-500 text-xs">(Optional)</span></label>
                                            <input value={shopInfoState.eccp} onChange={handleShopInfoInput} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' type="text" name='eccp' id='eccp' placeholder='Enter your ECCP number' />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-end">
                                         {/* Show Cancel only if editing existing info */}
                                        {userInfo?.shopInfo && Object.keys(userInfo.shopInfo).length > 0 && (
                                            <button type="button" onClick={handleCancelShopInfoEdit} className='w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 flex items-center justify-center gap-2'>
                                                <FaXmark /> Cancel
                                            </button>
                                        )}
                                        <button type="submit" disabled={authLoader} className={`w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${authLoader ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30'}`}>
                                            {authLoader ? <BeatLoader color="#ffffff" size={8}/> : <FaSave />}
                                            {userInfo?.shopInfo ? 'Update Information' : 'Save Information'}
                                        </button>
                                    </div>
                                </form>
                             ) : userInfo?.shopInfo ? (
                                // --- Display Mode ---
                                <div className='space-y-2'>
                                    <InfoDisplay label="Shop Name" value={userInfo.shopInfo.shopName} />
                                    <InfoDisplay label="Division" value={userInfo.shopInfo.division} />
                                    <InfoDisplay label="District" value={userInfo.shopInfo.district} />
                                    <InfoDisplay label="Sub District" value={userInfo.shopInfo.sub_district} />
                                    <InfoDisplay label="ECCP" value={userInfo.shopInfo.eccp} />
                                </div>
                             ) : (
                                // --- Prompt to Add Info ---
                                 <div className="text-center py-6">
                                     <p className="text-base text-amber-400 mb-4">Shop Information Not Added Yet!</p>
                                     <button onClick={() => setIsEditingShopInfo(true)} className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold px-5 py-2 rounded-lg shadow hover:shadow-lg transition-all">
                                         Add Shop Info Now
                                     </button>
                                 </div>
                             )}
                        </div>
                    </div>


                </div>
            </div>

            {/* ... (Styles) ... */}
            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Remove Number Input Spinners */
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
};

export default Profile;