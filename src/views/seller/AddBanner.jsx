import React, { useEffect, useState, useCallback } from 'react';
import { FaRegImage, FaSpinner, FaUpload, FaTrashAlt } from "react-icons/fa"; // Consistent icons
import { BeatLoader } from 'react-spinners'; // Consistent loader
import { overrideStyle } from '../../utils/utils'; // Keep if used by BeatLoader
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added Link, useNavigate
import { useDispatch, useSelector } from 'react-redux';
import {
    add_banner,
    get_banner,
    messageClear,
    update_banner
} from '../../store/Reducers/bannerReducer'; // Adjust path/names if needed
import toast from 'react-hot-toast';

// Placeholder image path
const defaultBannerPreview = '/images/banner_upload_placeholder.png'; // ADJUST PATH AS NEEDED

const AddBanner = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate(); // For potential navigation

    // State from Redux store
    const {
        loader: isSubmitting, // Loader for add/update actions
        successMessage,
        errorMessage,
        banner, // Existing banner data
        loading: isLoadingBanner // Loader for fetching existing banner
    } = useSelector(state => state.banner); // Ensure 'banner' is the correct slice name

    // Component State
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); // URL for display
    const [imageFile, setImageFile] = useState(null); // File object for upload
    const [existingBannerUrl, setExistingBannerUrl] = useState(''); // Store original URL when editing

    // --- Fetch Existing Banner ---
    useEffect(() => {
        if (productId) {
            dispatch(get_banner(productId));
        }
        // Cleanup
        return () => {
            setImagePreviewUrl(''); setImageFile(null); setExistingBannerUrl('');
            dispatch(messageClear());
        };
    }, [productId, dispatch]);

    // --- Populate Form/Preview from Fetched Banner ---
    useEffect(() => {
        if (banner?._id && banner.productId === productId) {
            setImagePreviewUrl(banner.banner || '');
            setExistingBannerUrl(banner.banner || '');
            setImageFile(null);
            const fileInput = document.getElementById('bannerImageInput');
            if (fileInput) fileInput.value = null;
        } else if (!isLoadingBanner && productId && !banner?._id ) {
             setImagePreviewUrl(''); setExistingBannerUrl(''); setImageFile(null);
        }
    }, [banner, productId, isLoadingBanner]);

    // --- Handle Messages ---
    const handleMessages = useCallback(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            setImageFile(null);
            const fileInput = document.getElementById('bannerImageInput');
            if (fileInput) fileInput.value = null;
             dispatch(messageClear());
            // Refetch banner after success to show the latest
            if (productId) dispatch(get_banner(productId));
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, productId]); // Added productId dependency

    useEffect(() => {
        handleMessages();
    }, [handleMessages]);


    // --- Handle Image Selection ---
    const imageHandle = (e) => {
        const file = e.target.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const maxSizeMB = 3; // Example: 3MB limit

        if (file) {
            if (!allowedTypes.includes(file.type)) { toast.error(`Invalid file type...`); return; }
            if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Image size exceeds ${maxSizeMB}MB limit.`); return; }
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) { URL.revokeObjectURL(imagePreviewUrl); }
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

     // --- Cleanup Blob URL ---
     useEffect(() => {
        const currentUrl = imagePreviewUrl;
        return () => {
            if (currentUrl && currentUrl.startsWith('blob:')) { URL.revokeObjectURL(currentUrl); }
        };
    }, [imagePreviewUrl]);

    // Determine if we are in editing mode
    const isEditingMode = Boolean(banner?._id && banner.productId === productId);

    // --- Handle Form Submission (Add or Update) ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate: Need an image if adding OR if updating and no existing banner was loaded
        if (!imageFile && !existingBannerUrl) {
            toast.error('Please select a banner image to upload.');
            return;
        }
        // If editing and no new file selected, no need to submit (or backend handles it)
        if (isEditingMode && !imageFile) {
             toast.info('No new image selected. Banner remains unchanged.');
             return; // Don't submit if editing and no new image
        }


        const formData = new FormData();
        formData.append('productId', productId);
        if (imageFile instanceof File) {
             formData.append('mainban', imageFile); // Backend expects 'mainban'
        }

        if (isEditingMode) { // If banner exists for this product, update it
            dispatch(update_banner({ info: formData, bannerId: banner._id }));
        } else { // Otherwise, add a new one
            dispatch(add_banner(formData));
        }
    };

    // --- Handle Preview Image Error ---
    const handlePreviewError = (e) => {
        e.target.onerror = null;
        e.target.src = defaultBannerPreview;
    };

    // --- Remove/Revert Image ---
    const removeImage = () => {
        setImageFile(null);
        setImagePreviewUrl(existingBannerUrl || ''); // Revert to original URL or clear
        const fileInput = document.getElementById('bannerImageInput');
        if (fileInput) fileInput.value = null;
    };

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
             {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                 <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>
                        {isEditingMode ? 'Update Product Banner' : 'Add Product Banner'}
                     </h1>
                     <Link to={`/seller/dashboard/products`} className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                        ← Back to Products
                     </Link>
                 </div>

                 <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                      {isLoadingBanner ? (
                         <div className="min-h-[400px] flex flex-col justify-center items-center text-center">
                             <BeatLoader color="#34d399" size={15} />
                             <p className="mt-4 text-gray-400">Loading banner information...</p>
                         </div>
                      ) : (
                         <form onSubmit={handleSubmit}>
                            <div className="flex flex-col items-center gap-6">

                                 {/* Image Upload Area */}
                                 <div className='w-full max-w-2xl'>
                                     <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                                         Banner Image {!isEditingMode && <span className="text-rose-500">*</span>}
                                         {isEditingMode && <span className='text-xs text-gray-400'> (Optional: Change existing)</span>}
                                         <span className='block text-xs text-gray-400'>(Recommended: Landscape, Max 3MB)</span>
                                     </label>
                                    <label
                                        className={`flex flex-col justify-center items-center h-60 sm:h-72 w-full cursor-pointer border-2 border-dashed rounded-lg transition-all duration-300 group relative overflow-hidden ${ // Adjusted height
                                             imagePreviewUrl ? 'border-cyan-500/60 p-1 bg-[#303650]/20 hover:border-cyan-400/80' : 'border-gray-600/80 hover:border-purple-500/80 bg-[#303650]/60 hover:bg-[#303650]/80'
                                        }`}
                                        htmlFor="bannerImageInput" // Match input ID
                                    >
                                        {imagePreviewUrl ? (
                                            <img className='h-full w-auto max-w-full object-contain rounded' src={imagePreviewUrl} alt="Banner Preview" onError={handlePreviewError} />
                                        ) : (
                                            <div className='flex flex-col items-center justify-center text-center text-gray-500 group-hover:text-cyan-400 transition-colors p-4'>
                                                <FaRegImage className="text-4xl mb-2" /> {/* Using FaRegImage as in original */}
                                                <span className='text-sm font-semibold'>Select Banner Image</span>
                                                <span className='text-xs mt-1'>PNG, JPG, WEBP, GIF (Max 3MB)</span>
                                            </div>
                                        )}
                                    </label>
                                    <input onChange={imageHandle} className='hidden' type="file" id='bannerImageInput' name='mainban' accept="image/png, image/jpeg, image/webp, image/gif" />
                                     {/* Remove/Revert Button */}
                                     {imagePreviewUrl && (
                                         <div className="text-center mt-2">
                                             <button type="button" onClick={removeImage} className="text-xs text-rose-400 hover:text-rose-300 underline">
                                                 {imageFile ? 'Clear Selection' : (existingBannerUrl ? 'Revert to Original' : 'Remove Image')}
                                             </button>
                                         </div>
                                     )}
                                 </div>

                                {/* Submit Button */}
                                <div className="mt-6 w-full flex justify-center">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!imageFile && !existingBannerUrl)} // Disable if no image selected/exists or submitting
                                        className={`w-full sm:w-auto min-w-[200px] bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 text-base flex items-center justify-center gap-2 ${ (isSubmitting || (!imageFile && !existingBannerUrl)) ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30' }`}
                                    >
                                        {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaUpload /> }
                                        <span className="ml-1">{isSubmitting ? 'Processing...' : (isEditingMode ? 'Update Banner' : 'Add Banner')}</span>
                                    </button>
                                </div>

                            </div>
                        </form>
                      )}
                 </div>
            </div>

             <style jsx>{`
                 /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
             `}</style>
        </div>
    );
};

export default AddBanner;