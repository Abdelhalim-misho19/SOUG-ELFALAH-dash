import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaSpinner, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
    get_admin_ad_banners,
    delete_ad_banner,
    messageClear,
    update_ad_banner // Make sure this handles status update
} from '../../store/Reducers/adBannerReducer'; // Adjust paths/names if needed
import Swal from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import tooltip CSS
import { BeatLoader } from 'react-spinners'; // Consistent loader

// Default placeholder image path (relative to public folder)
const defaultBannerImage = '/images/banner_placeholder.png'; // ADJUST PATH AS NEEDED

// Helper to format date string or return 'N/A'
const formatDateDisplay = (dateString) => {
    if (!dateString) return <span className="text-gray-500 italic">Not Set</span>; // Improved display for unset dates
    try {
        // Check if already just YYYY-MM-DD
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD
                 year: 'numeric', month: '2-digit', day: '2-digit'
            });
        }
        // Otherwise parse fully
        const dt = new Date(dateString);
        if (isNaN(dt.getTime())) return <span className="text-red-400 italic">Invalid Date</span>;
        return dt.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        console.error("Error formatting display date:", dateString, e);
        return <span className="text-red-400 italic">Error</span>;
    }
};

// Status Badge Component
const BannerStatusBadge = ({ status }) => {
    const isActive = status?.toLowerCase() === 'active';
    const baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-flex items-center gap-1 border whitespace-nowrap';
    const colors = isActive
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    const Icon = isActive ? FaCheckCircle : FaTimesCircle;
    const text = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    return (
        <span className={`${baseStyle} ${colors}`}>
            <Icon size={12} />
            {text}
        </span>
    );
};

// Skeleton Row
const SkeletonBannerRow = () => (
     <tr className="border-b border-gray-700/50 animate-pulse">
         <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-4"></div></td>
         <td className="py-3 px-4"><div className="h-[50px] w-[120px] bg-gray-600/50 rounded-md"></div></td>
         <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></td>
         <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-full"></div></td>
         <td className="py-3 px-4"><div className="h-6 bg-gray-600/50 rounded-full w-20"></div></td>
         <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
         <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
         <td className="py-3 px-4"> <div className="flex justify-center gap-3"><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div></div></td>
     </tr>
);


const AdminAdBanners = () => {
    const dispatch = useDispatch();
    const {
        adBanners = [],
        loading: bannerListLoading,
        successMessage,
        errorMessage,
        loadingAction // Action-specific loader (e.g., for delete/update)
    } = useSelector(state => state.adBanner);

     // State to track which banner's status is currently being toggled
     const [togglingStatusId, setTogglingStatusId] = useState(null);
     const [deletingId, setDeletingId] = useState(null); // Track deleting


    // Fetch banners on mount
    useEffect(() => {
        dispatch(get_admin_ad_banners());
    }, [dispatch]);

    // Handle messages and potentially refetch list
    useEffect(() => {
        let shouldRefetch = false;
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            shouldRefetch = true; // Refetch on any success for simplicity
            setTogglingStatusId(null); // Clear toggle loading state
            setDeletingId(null);       // Clear delete loading state
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            setTogglingStatusId(null); // Clear toggle loading state
            setDeletingId(null);       // Clear delete loading state
            dispatch(messageClear());
        }
        // Optionally refetch list if an action was successful
        // if (shouldRefetch) {
        //     dispatch(get_admin_ad_banners());
        // }
        // Note: If your reducers correctly update the list immutably after add/update/delete,
        // you might not need to refetch here. Test thoroughly.

    }, [successMessage, errorMessage, dispatch]);

    // Handle banner deletion
    const handleDelete = (bannerId, bannerTitle) => {
        if(deletingId) return; // Prevent multiple delete clicks

        Swal.fire({
            title: 'Delete Banner?',
            html: `Are you sure you want to delete: <br/><b>${bannerTitle || 'this banner'}</b>? <br/><span class='text-xs text-red-400'>This action cannot be undone.</span>`,
            icon: 'warning',
            iconColor: '#f87171', // Red color for warning
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626', // Red-600
            cancelButtonColor: '#374151', // Gray-700
            background: '#1e2337', // Darker background for modal
            color: '#e5e7eb',
            customClass: {
                popup: 'border border-red-500/50 rounded-lg shadow-xl',
                confirmButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 !bg-red-600 hover:!bg-red-700',
                cancelButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 mr-2 !bg-gray-600 hover:!bg-gray-700',
            },
             showLoaderOnConfirm: true, // Show loader on confirm button
             preConfirm: async () => { // Use preConfirm to handle async dispatch
                 setDeletingId(bannerId); // Set loading state
                 try {
                     await dispatch(delete_ad_banner(bannerId)).unwrap(); // Use unwrap to catch potential errors from thunk
                     // Swal handles success message implicitly or you can add one
                 } catch (error) {
                     Swal.showValidationMessage(`Request failed: ${error?.message || 'Unknown error'}`);
                      setDeletingId(null); // Reset loading on failure
                 }
             },
             allowOutsideClick: () => !Swal.isLoading() // Prevent closing while loading
        }).then((result) => {
             // Reset loading state if modal closed without confirmation (e.g., cancel)
             if (!result.isConfirmed) {
                 setDeletingId(null);
             }
         });
    };


    // Handle toggling status
    const toggleStatus = async (banner) => {
        if (togglingStatusId) return; // Prevent clicking while another is processing

        const newStatus = banner.status === 'active' ? 'inactive' : 'active';
        const formData = new FormData();
        formData.append('status', newStatus);
        setTogglingStatusId(banner._id); // Set loading state for this specific banner

        try {
            // Dispatch update action - assuming it takes { adBannerId, formData }
             await dispatch(update_ad_banner({ adBannerId: banner._id, formData })).unwrap();
             // Success toast is handled by the useEffect for successMessage
        } catch (error) {
            // Error toast is handled by the useEffect for errorMessage
            console.error("Failed to toggle status:", error);
            setTogglingStatusId(null); // Reset loading on failure
        }
        // No finally block needed here as success/error useEffect handles resetting togglingStatusId
    };


    // Function to handle image errors
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop if placeholder also fails
        e.target.src = defaultBannerImage;
    };

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-full mx-auto">
                 {/* Page Header */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Manage Ad Banners</h1>
                     <Link
                        to="/admin/dashboard/ad-banners/add"
                        className='bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                    >
                         <FaPlus size={14}/> Add New Banner
                     </Link>
                 </div>

                {/* Main Content Card */}
                <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    {/* Optional Search Bar */}
                    {/* <div className="mb-6"> <Search ... /> </div> */}

                    {/* Banner Table Container */}
                    <div className='relative overflow-x-auto rounded-lg border border-gray-700/50'>
                        <table className='w-full text-sm text-left text-gray-300'>
                            <thead className='text-xs uppercase text-gray-400 bg-[#303650]/50 sticky top-0 z-10'>
                                <tr>
                                    <th scope='col' className='py-3 px-4 w-12'>No</th>
                                    <th scope='col' className='py-3 px-4 min-w-[140px]'>Image</th>
                                    <th scope='col' className='py-3 px-4'>Title</th>
                                    <th scope='col' className='py-3 px-4'>Link</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Status</th>
                                    <th scope='col' className='py-3 px-4'>Start Date</th>
                                    <th scope='col' className='py-3 px-4'>End Date</th>
                                    <th scope='col' className='py-3 px-4 min-w-[130px] text-center'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {/* Loading State */}
                                {bannerListLoading && adBanners.length === 0 && (
                                     Array.from({ length: 5 }).map((_, i) => <SkeletonBannerRow key={`skel-${i}`} />)
                                 )}

                                {/* Data Rows */}
                                {!bannerListLoading && adBanners.length > 0 && (
                                    adBanners.map((banner, i) => {
                                        const isToggling = togglingStatusId === banner._id && loadingAction;
                                        const isDeleting = deletingId === banner._id && loadingAction;
                                        return (
                                            <tr key={banner._id} className="hover:bg-[#303650]/40 transition-colors align-middle">
                                                <td className='py-3 px-4 font-medium text-gray-400'>{i + 1}</td>
                                                <td className='py-3 px-4'>
                                                    <img
                                                       className='w-[120px] h-auto max-h-[60px] object-contain rounded border border-gray-600/50 bg-gray-700/30' // Added bg
                                                       src={banner.bannerImage || defaultBannerImage}
                                                       alt={banner.title || 'Ad Banner'}
                                                       onError={handleImageError}
                                                       loading="lazy"
                                                    />
                                                </td>
                                                <td className='py-3 px-4 text-gray-200'>{banner.title || <span className='italic text-gray-500'>No Title</span>}</td>
                                                <td className='py-3 px-4 max-w-[250px]'> {/* Max width for link */}
                                                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors truncate inline-block" title={banner.link} > {banner.link} </a>
                                                </td>
                                                <td className='py-3 px-4 text-center'><BannerStatusBadge status={banner.status} /></td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-400'>{formatDateDisplay(banner.startDate)}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-400'>{formatDateDisplay(banner.endDate)}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='flex justify-center items-center gap-2 sm:gap-3'>
                                                        {/* Toggle Status Button */}
                                                        <button onClick={() => toggleStatus(banner)} disabled={isToggling || isDeleting} className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${banner.status === 'active' ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20' }`} data-tooltip-id="action-tip" data-tooltip-content={banner.status === 'active' ? 'Deactivate' : 'Activate'}>
                                                            {isToggling ? <FaSpinner className="animate-spin" size={16}/> : (banner.status === 'active' ? <FaEye size={16}/> : <FaEyeSlash size={16}/>)}
                                                        </button>
                                                        {/* Edit Button */}
                                                        <Link to={`/admin/dashboard/ad-banners/edit/${banner._id}`} className='p-2 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md transition-colors duration-200' data-tooltip-id="action-tip" data-tooltip-content="Edit Banner"> <FaEdit size={16}/> </Link>
                                                        {/* Delete Button */}
                                                        <button onClick={() => handleDelete(banner._id, banner.title)} disabled={isToggling || isDeleting} className='p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed' data-tooltip-id="action-tip" data-tooltip-content="Delete Banner">
                                                            {isDeleting ? <FaSpinner className="animate-spin" size={15}/> : <FaTrash size={15}/>}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                 {/* Empty State Row */}
                                 {!bannerListLoading && adBanners.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-10 px-4 text-center text-gray-500 italic">
                                            No ad banners created yet.
                                            <Link to="/admin/dashboard/ad-banners/add" className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1 font-semibold">Add one now</Link>!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                         <Tooltip id="action-tip" place="top" style={{ backgroundColor: "#303650", color: "#e5e7eb", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", zIndex: 50 }}/>
                    </div>

                    {/* Optional: Pagination if implementing */}
                    {/* <div className='w-full flex justify-end mt-6'> <Pagination ... /> </div> */}
                </div>
            </div>

             {/* Custom CSS */}
             <style jsx>{`
                 /* Wave Background & Particles (keep as is) */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Ensure table cells are vertically aligned */
                 td, th { vertical-align: middle; }
                 /* Tooltip z-index */
                 #__react_tooltip { z-index: 999 !important; }
            `}</style>
        </div>
    );
};

export default AdminAdBanners;