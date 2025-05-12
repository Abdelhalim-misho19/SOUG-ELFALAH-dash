import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom'; // Added Link for potential back button
import { get_seller, seller_status_update, messageClear } from '../../store/Reducers/sellerReducer';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners'; // Consistent loader
import {
    MdEmail, MdStorefront, MdLocationOn, MdAccountCircle, MdCheckCircle,
    MdCancel, MdHourglassEmpty, MdPayment, MdLocationCity, MdEditNote // Added MdEditNote
} from 'react-icons/md';
import { FaMapMarkedAlt } from 'react-icons/fa';

// --- Re-use or Define StatusBadge ---
// (Assuming this component is available from previous steps or defined here)
const StatusBadge = ({ status, type }) => { // Added type prop
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-flex items-center gap-1.5 border';
    let colors = '';
    let Icon = MdHourglassEmpty; // Default icon
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    if (type === 'payment') {
        // Payment Status: active/inactive
        Icon = status?.toLowerCase() === 'active' ? MdCheckCircle : MdCancel;
        colors = status?.toLowerCase() === 'active'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    } else { // Account Status: active/pending/deactive
        switch (status?.toLowerCase()) {
            case 'active': colors = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; Icon = MdCheckCircle; break;
            case 'pending': colors = 'bg-amber-500/20 text-amber-300 border-amber-500/30'; Icon = MdHourglassEmpty; break;
            case 'deactive': default: colors = 'bg-rose-500/20 text-rose-300 border-rose-500/30'; Icon = MdCancel; break;
        }
    }
    return (
        <span className={`${baseStyle} ${colors}`}>
             {Icon && <Icon className="text-sm mr-0.5"/>} {/* Added small margin */}
             {statusText}
        </span>
    );
};
// --- End StatusBadge ---

// --- Reusable Info Row Component ---
const InfoRow = ({ label, value, icon, children }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-700/50 last:border-b-0">
        {icon && React.createElement(icon, { className: "text-cyan-400 mt-1 text-lg shrink-0 w-5" })} {/* Fixed icon width */}
        <span className="font-medium text-gray-400 w-24 sm:w-28 shrink-0">{label}:</span> {/* Adjusted label width */}
        <div className="flex-grow text-gray-200 break-words">
            {children || (value || 'N/A')}
        </div>
    </div>
);
// --- End Info Row ---


const SellerDetails = () => {
    const dispatch = useDispatch();
    const { seller, successMessage, errorMessage, isLoadingSeller } = useSelector((state) => state.seller);
    const { sellerId } = useParams();

    const [status, setStatus] = useState('');
    const [initialStatus, setInitialStatus] = useState('');

    useEffect(() => {
        dispatch(get_seller(sellerId));
    }, [sellerId, dispatch]);

    useEffect(() => {
        if (seller) {
            setStatus(seller.status || ''); // Default to empty string if undefined
            setInitialStatus(seller.status || '');
        } else {
             setStatus('');
             setInitialStatus('');
        }
    }, [seller]);

    // Memoized callback for message handling
    const handleMessages = useCallback(() => {
        if (successMessage) {
            toast.success(successMessage);
             if (seller && successMessage.includes('Updated')) {
                 setInitialStatus(seller.status); // Update initial status after successful API update
             }
             dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage);
             setStatus(initialStatus); // Revert local status state on error
             dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, seller, initialStatus]);

    useEffect(() => {
        handleMessages();
    }, [handleMessages]);


    const submit = (e) => {
        e.preventDefault();
        if (!status) {
            toast.error("Please select a status.");
            return;
        }
        if (status === initialStatus) {
            // Optionally disable button instead of toast
            // toast.info("Status is already set to " + status + ".");
            return;
        }
        dispatch(seller_status_update({ sellerId, status }));
    };


    // --- RENDER STATES ---
    if (isLoadingSeller) {
        return (
             <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center">
                <BeatLoader color="#34d399" size={15} />
            </div>
        );
    }

     if (!seller && !isLoadingSeller) {
        return (
             <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center text-center">
                <div className="p-6 bg-[#252A40]/70 rounded-lg border border-red-700 shadow-lg">
                   <h2 className="text-xl text-red-300 mb-2">Error Loading Seller</h2>
                   <p className="text-gray-400 mb-4">Could not load details for this seller.</p>
                   <Link to="/admin/dashboard/sellers" className="mt-4 inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm transition-colors">
                       Back to Sellers List
                   </Link>
                </div>
            </div>
        );
     }
    // --- END RENDER STATES ---

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-6xl mx-auto">
                 {/* Page Header */}
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
                        Seller Profile
                    </h1>
                     {/* Optional: Add back button or other actions */}
                     <Link to="/admin/dashboard/sellers" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium hidden sm:block">
                        ← Back to Sellers List
                     </Link>
                </div>

                {/* Main Panel */}
                <div className="w-full rounded-xl p-5 sm:p-6 lg:p-8 bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">

                    <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

                        {/* Left Column: Image & Basic Info */}
                        <div className="w-full md:w-[35%] lg:w-1/3 flex flex-col items-center md:items-start flex-shrink-0">
                            {/* Image */}
                            <div className="mb-6 relative">
                                {seller?.image ? (
                                    <img
                                        className="w-36 h-36 lg:w-44 lg:h-44 rounded-full object-cover border-4 border-cyan-600/50 shadow-lg shadow-cyan-500/20"
                                        src={seller.image}
                                        alt={seller?.name}
                                    />
                                ) : (
                                    <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 border-4 border-cyan-600/50 shadow-lg shadow-cyan-500/20">
                                        <MdAccountCircle size={80} />
                                    </div>
                                )}
                                 {/* Online/Offline indicator if needed */}
                                 {/* <span className={`absolute bottom-2 right-2 block w-4 h-4 rounded-full border-2 border-[#252A40] ${seller.isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`}></span> */}
                            </div>

                            {/* Basic Info Text */}
                            <div className="text-center md:text-left w-full space-y-2">
                                <h2 className="text-xl lg:text-2xl font-semibold text-gray-100" title={seller?.name}>
                                    {seller?.name || 'Seller Name'}
                                </h2>
                                <p className="text-sm font-medium text-purple-400">{seller?.role ? seller.role.charAt(0).toUpperCase() + seller.role.slice(1) : 'Seller'}</p>
                                <a href={`mailto:${seller?.email}`} className="text-sm text-gray-400 hover:text-cyan-300 transition duration-200 flex items-center justify-center md:justify-start gap-1.5" title={seller?.email}>
                                    <MdEmail />
                                    <span className="break-all">{seller?.email || 'No Email Provided'}</span>
                                </a>

                                {/* Status Badges */}
                                <div className="pt-4 space-y-3">
                                     <div className="flex flex-col items-center md:items-start">
                                        <span className="text-xs text-gray-500 mb-1">Account Status</span>
                                        <StatusBadge status={seller?.status} type="account" />
                                     </div>
                                     <div className="flex flex-col items-center md:items-start">
                                         <span className="text-xs text-gray-500 mb-1">Payment Status</span>
                                         <StatusBadge status={seller?.payment} type="payment" />
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Shop Info & Status Management */}
                        <div className="w-full md:w-[65%] lg:w-2/3 flex flex-col gap-6 lg:gap-8 mt-6 md:mt-0">

                            {/* Shop Information Card */}
                            <div className="p-5 lg:p-6 rounded-xl bg-[#1e2337]/60 border border-gray-700/60 shadow-md">
                                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-700/50 pb-3">
                                    <MdStorefront className="text-cyan-400" /> Shop Information
                                </h3>
                                <div className="text-sm space-y-1"> {/* Reduced gap between rows */}
                                    <InfoRow label="Shop Name" value={seller?.shopInfo?.shopName} />
                                    <InfoRow label="Division" value={seller?.shopInfo?.division} icon={MdLocationOn} />
                                    <InfoRow label="Municipality" value={seller?.shopInfo?.district} icon={MdLocationCity} />
                                    <InfoRow label="District" value={seller?.shopInfo?.sub_district} icon={FaMapMarkedAlt} />
                                    {seller?.shopInfo?.eccp && <InfoRow label="ECCP" value={seller.shopInfo.eccp} icon={MdPayment} />}
                                </div>
                            </div>

                            {/* Status Update Card */}
                            <div className="p-5 lg:p-6 rounded-xl bg-[#1e2337]/60 border border-gray-700/60 shadow-md">
                                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-700/50 pb-3">
                                    <MdEditNote className="text-purple-400"/> Manage Account Status
                                </h3>
                                <form onSubmit={submit}>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="w-full sm:flex-grow">
                                            <label htmlFor="statusSelect" className="sr-only">Select Account Status</label>
                                            <select
                                                id="statusSelect"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-lg bg-[#303650]/80 border border-gray-600 text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm"
                                                required
                                                aria-describedby="statusHelpText" // For accessibility
                                            >
                                                <option value="" disabled>-- Select New Status --</option>
                                                <option value="active">Active</option>
                                                <option value="deactive">Deactivate</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className={`w-full sm:w-auto flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold text-sm shadow-md transition-all duration-300 ${
                                                (!status || status === initialStatus)
                                                ? 'opacity-60 cursor-not-allowed from-gray-500 to-gray-600'
                                                : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a2e] focus:ring-cyan-500'
                                            }`}
                                            disabled={!status || status === initialStatus}
                                        >
                                            Update Status
                                        </button>
                                    </div>
                                     {status === initialStatus && status !== '' && (
                                        <p id="statusHelpText" className="text-xs text-amber-400 mt-2 text-center sm:text-left">Current status is already '{status}'. Choose a different one to update.</p>
                                     )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                /* Particles */
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
            `}</style>
        </div>
    );
};

export default SellerDetails;