import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaImages, FaSpinner, FaFloppyDisk, FaPlus, FaList, FaChevronDown } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    add_ad_banner,
    update_ad_banner,
    messageClear,
    get_admin_ad_banners
} from '../../store/Reducers/adBannerReducer'; // Ensure these match your export names
import { BeatLoader } from 'react-spinners'; // Use a consistent loader

// Helper function (keep as is or refine error handling)
const formatDateForInput = (date) => {
    if (!date) return '';
    try {
        const d = date instanceof Date ? date : new Date(date);
        // Check if the date is valid after parsing
        if (isNaN(d.getTime())) {
             console.warn("Invalid date received for formatting:", date);
             return '';
        }
        return d.toISOString().split('T')[0]; // Simpler, standard way
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return '';
    }
};

// Placeholder image path (relative to public folder)
const defaultBannerImage = '/images/banner_placeholder.png'; // ADJUST PATH AS NEEDED

const AddEditAdBanner = () => {
    const { adBannerId } = useParams(); // This determines if we are editing
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Select state from the adBanner slice
    const { loader: isSubmitting, successMessage, errorMessage, adBanners = [], loading: isLoadingBanners } = useSelector(state => state.adBanner);

    // Form State
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [status, setStatus] = useState('active'); // Default status
    const [imageShow, setImageShow] = useState(''); // URL for display (blob or existing)
    const [imageFile, setImageFile] = useState(null); // The actual file object for upload
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isEditing = Boolean(adBannerId); // Determine edit mode based on param

    // --- Fetch Banner Data for Editing ---
    useEffect(() => {
        // Only fetch if editing and banner data isn't already loaded for this ID
        if (isEditing) {
             const bannerExists = adBanners.some(b => b._id === adBannerId);
             if (!bannerExists && !isLoadingBanners) {
                  console.log("Fetching banners for edit mode...");
                  // Fetch all or fetch single? Adjust action if needed
                  dispatch(get_admin_ad_banners({ page: 1, parPage: 100, searchValue: '' })); // Fetching list temporarily
                  // Ideally: dispatch(get_single_ad_banner(adBannerId));
             }
        }
    }, [isEditing, adBannerId, dispatch, isLoadingBanners, adBanners]); // Added adBanners to deps

    // --- Populate Form When Banner Data is Available ---
    useEffect(() => {
        if (isEditing && adBanners.length > 0) {
            const bannerToEdit = adBanners.find(b => b._id === adBannerId);
            if (bannerToEdit) {
                setTitle(bannerToEdit.title || '');
                setLink(bannerToEdit.link || '');
                setStatus(bannerToEdit.status || 'active');
                setImageShow(bannerToEdit.bannerImage || defaultBannerImage); // Use bannerImage field, fallback
                setImageFile(null); // Reset file on load
                setStartDate(formatDateForInput(bannerToEdit.startDate));
                setEndDate(formatDateForInput(bannerToEdit.endDate));
            } else if (!isLoadingBanners) {
                 // Handle case where ID exists but banner not found after fetch
                 console.warn("Banner ID specified but not found in fetched data:", adBannerId);
                 toast.error("Banner not found.", { /* styles */ });
                 navigate('/admin/dashboard/ad-banners');
             }
        }
    }, [isEditing, adBannerId, adBanners, isLoadingBanners, navigate]); // Dependencies updated

    // --- Reset Form State Function ---
     const resetForm = useCallback(() => {
        setTitle(''); setLink(''); setStatus('active');
        setImageShow(''); setImageFile(null);
        setStartDate(''); setEndDate('');
        // Clear file input
        const fileInput = document.getElementById('bannerImageInput');
        if (fileInput) fileInput.value = null;
    }, []); // No dependencies, safe to memoize

    // --- Message Handling ---
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }}); // Updated style
            dispatch(messageClear());
            navigate('/admin/dashboard/ad-banners'); // Navigate back to list on success
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }}); // Updated style
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, navigate]);

    // --- Handle Image Selection ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (file) {
            if (!allowedTypes.includes(file.type)) {
                 toast.error("Invalid file type (PNG, JPG, GIF, WEBP allowed).", { /* styles */ });
                 return;
             }
             if (file.size > 2 * 1024 * 1024) { // 2MB limit
                  toast.error('Image size exceeds 2MB limit.');
                  return;
             }
             // Revoke previous blob URL if exists
             if (imageShow && imageShow.startsWith('blob:')) { URL.revokeObjectURL(imageShow); }
             setImageFile(file); // Store the file object
             setImageShow(URL.createObjectURL(file)); // Create and show blob URL
        }
    };

     // --- Cleanup Blob URL ---
     useEffect(() => {
        const currentUrl = imageShow;
        // Cleanup function runs when component unmounts or imageShow changes
        return () => {
            if (currentUrl && currentUrl.startsWith('blob:')) {
                // console.log("Revoking blob URL:", currentUrl); // Debug log
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [imageShow]);

    // --- Handle Form Submission ---
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation
        if (!link.trim()) { toast.error("Link URL is required."); return; }
        if (!isEditing && !imageFile) { toast.error("Banner image is required when adding."); return; }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) { toast.error("End date cannot be before start date."); return; }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('link', link.trim());
        formData.append('status', status);
        // Only append dates if they are set
        if(startDate) formData.append('startDate', startDate);
        if(endDate) formData.append('endDate', endDate);
        // Only append image if a *new* file was selected
        if (imageFile instanceof File) {
            formData.append('bannerImage', imageFile);
        }

        if (isEditing) {
            dispatch(update_ad_banner({ adBannerId, formData }));
        } else {
            dispatch(add_ad_banner(formData));
        }
    };

     // Function to handle image load errors for the preview
     const handleImageError = (e) => {
        console.warn("Error loading banner image preview, using default.");
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = defaultBannerImage;
        // Optionally update state if needed, though setting src directly often works
        // setImageShow(defaultBannerImage);
    };

    // --- Loading State for Fetching Edit Data ---
    if (isEditing && isLoadingBanners && !adBanners.find(b => b._id === adBannerId)) {
         return (
             <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex flex-col justify-center items-center text-center'>
                 <BeatLoader color="#34d399" size={15} />
                 <span className='text-gray-400 mt-4'>Loading Banner Data...</span>
             </div>
         );
     }

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 max-w-5xl mx-auto"> {/* Centered content */}
                {/* Main Card */}
                <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-xl'>
                    {/* Header */}
                    <div className='flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-gray-700/50 mb-6'>
                        <h1 className='text-xl md:text-2xl font-bold text-gray-100 tracking-tight'>
                            {isEditing ? 'Edit Ad Banner' : 'Add New Ad Banner'}
                        </h1>
                        <Link to='/admin/dashboard/ad-banners' className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                           <FaList size={12}/> View All Banners
                         </Link>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {/* Column 1 & 2: Inputs */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">Title <span className="text-gray-500 text-xs">(Optional)</span></label>
                                    <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400" placeholder="e.g., Summer Sale Banner" />
                                </div>
                                {/* Link URL */}
                                <div>
                                    <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1.5">Link URL <span className="text-rose-500">*</span></label>
                                    <input type="url" id="link" name="link" value={link} onChange={(e) => setLink(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400" placeholder="https://example.com/your-landing-page" />
                                </div>
                                 {/* Status Select */}
                                <div>
                                     <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                                     <div className="relative">
                                        <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="appearance-none w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 cursor-pointer">
                                            <option value="active" className="bg-[#252A40]">Active</option>
                                            <option value="inactive" className="bg-[#252A40]">Inactive</option>
                                        </select>
                                         <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>
                                </div>

                                {/* Dates Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1.5">Start Date <span className="text-gray-500 text-xs">(Optional)</span></label>
                                        <input type="date" id="startDate" name="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-400 dark:[color-scheme:dark]" max={endDate || undefined} />
                                    </div>
                                    <div>
                                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1.5">End Date <span className="text-gray-500 text-xs">(Optional)</span></label>
                                        <input type="date" id="endDate" name="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-400 dark:[color-scheme:dark]" min={startDate || undefined} />
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Image Upload */}
                            <div className="md:col-span-1 flex flex-col">
                                <label htmlFor="bannerImageInput" className='block text-sm font-medium text-gray-300 mb-1.5'>
                                    Banner Image { !isEditing && <span className="text-rose-500">*</span>}
                                    { isEditing && <span className="text-gray-500 text-xs"> (Optional: change)</span> }
                                 </label>
                                {/* Image Preview / Dropzone */}
                                <label
                                    className={`flex flex-col justify-center items-center h-48 md:h-full w-full cursor-pointer border-2 border-dashed rounded-lg transition-all duration-300 group relative overflow-hidden ${
                                        imageShow ? 'border-cyan-500/60 p-1 bg-[#303650]/20 hover:border-cyan-400/80' : 'border-gray-600/80 hover:border-purple-500/80 bg-[#303650]/60 hover:bg-[#303650]/80'
                                    }`}
                                    htmlFor="bannerImageInput" // Ensure ID matches input
                                >
                                    {imageShow ? (
                                        <img className='h-full w-full object-contain rounded' src={imageShow || defaultBannerImage} alt="Banner Preview" onError={handleImageError} />
                                    ) : (
                                        <div className='flex flex-col items-center justify-center text-center text-gray-500 group-hover:text-cyan-400 transition-colors p-4'>
                                            <FaImages className="text-4xl mb-2" />
                                            <span className='text-sm font-semibold'>Select Banner Image</span>
                                            <span className='text-xs mt-1'>(Recommended: 1200x300px)</span>
                                        </div>
                                    )}
                                </label>
                                <input
                                    onChange={handleImageChange}
                                    className='hidden'
                                    type="file"
                                    id='bannerImageInput' // Use a more specific ID
                                    name='bannerImage'
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                />
                                {/* Remove Image Button */}
                                {imageShow && imageShow !== defaultBannerImage && (
                                     <button type="button" onClick={() => { setImageShow(''); setImageFile(null); const el = document.getElementById('bannerImageInput'); if(el) el.value=null; }} className="text-xs text-rose-400 hover:text-rose-300 mt-2 underline self-start"> Remove image </button>
                                )}
                             </div>
                        </div>

                        {/* Submit Button */}
                        <div className='flex justify-end mt-8 pt-6 border-t border-gray-700/50'>
                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className={`w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:from-cyan-600 hover:to-purple-700 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:from-gray-600 disabled:to-gray-700`}
                            >
                                {isSubmitting ? <FaSpinner className="animate-spin" /> : (isEditing ? <><FaFloppyDisk /> </> : <><FaPlus /></>)}
                                <span className="ml-1">{isSubmitting ? 'Processing...' : (isEditing ? 'Update Banner' : 'Add Banner')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

             {/* Custom CSS */}
             <style jsx>{`
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Style Select Dropdown Arrow */
                 select { /* appearance: none; */ }
                 select option { background-color: #252A40; color: #e5e7eb; }
                 /* Style Date Input Calendar Icon (Dark Mode) */
                 input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) brightness(0.8); cursor: pointer; padding-left: 5px; }
            `}</style>
        </div>
    );
};

export default AddEditAdBanner;