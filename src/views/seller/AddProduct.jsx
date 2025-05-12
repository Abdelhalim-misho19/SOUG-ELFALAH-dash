import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaImages, FaList, FaChevronDown, FaXmark, FaSpinner, FaPlus } from "react-icons/fa6"; // Using fa6 icons
import { useDispatch, useSelector } from 'react-redux';
import { get_category } from '../../store/Reducers/categoryReducer'; // Adjust path/names if needed
import { add_product, messageClear } from '../../store/Reducers/productReducer'; // Adjust path/names if needed
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners'; // Consistent loader

const AddProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // For navigation after success
    const { categorys } = useSelector(state => state.category); // Assuming 'category' slice holds categories
    const { loader: productLoader, successMessage, errorMessage } = useSelector(state => state.product); // Ensure 'product' slice is correct
    const { userInfo } = useSelector(state => state.auth); // Add this line

    // Product details state
    const [state, setState] = useState({
        name: "", description: '', discount: '', price: "", brand: "", stock: ""
    });
    // Category selection state
    const [cateShow, setCateShow] = useState(false);
    const [category, setCategory] = useState('');
    const [allCategory, setAllCategory] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    // Image state
    const [images, setImages] = useState([]); // File objects
    const [imageShow, setImageShow] = useState([]); // URLs for preview

    // Fetch categories
    useEffect(() => {
        dispatch(get_category({ searchValue: '', parPage: '', page: "" })); // Fetch all categories
    }, [dispatch]);

    // Update local category list when Redux state changes
    useEffect(() => {
        if (categorys.length > 0) {
            setAllCategory(categorys);
        }
    }, [categorys]);

    // Handle success/error messages
    const handleMessages = useCallback(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' } });
            dispatch(messageClear());
            // Reset form state
            setState({ name: "", description: '', discount: '', price: "", brand: "", stock: "" });
            setCategory('');
             // Revoke blob URLs and clear image states
             imageShow.forEach(img => { if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
            setImageShow([]);
            setImages([]);
             // Navigate back to products list after successful addition
             navigate('/seller/dashboard/products');
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, navigate, imageShow]); // Added navigate and imageShow

    useEffect(() => { handleMessages(); }, [handleMessages]);

    // Handle basic input changes
    const inputHandle = (e) => {
        const { name, value } = e.target;
         // Allow only non-negative numbers for price, stock, discount
         if (['price', 'stock', 'discount'].includes(name)) {
             // Allow empty string or positive numbers (integers or decimals for price)
             const isValid = value === '' || (name === 'price' ? /^\d*\.?\d*$/.test(value) : /^\d+$/.test(value));
             if (isValid) {
                 // For discount, clamp between 0 and 100
                 const processedValue = name === 'discount' ? Math.max(0, Math.min(100, parseInt(value || '0'))) : value;
                 setState(prev => ({ ...prev, [name]: processedValue }));
             }
         } else {
             setState(prev => ({ ...prev, [name]: value }));
         }
    };


    // Handle category search input
    const categorySearch = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        const filtered = categorys.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        setAllCategory(filtered);
    };

    // --- Image Handling Logic ---
    const MAX_IMAGES = 5;
    const MAX_SIZE_MB = 3;

    const imageHandle = (e) => {
        const files = Array.from(e.target.files); // Convert FileList to Array
        if (files.length === 0) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let currentImageCount = images.length;
        let addedCount = 0;
        const newImagesFiles = [];
        const newImageUrls = [];

        for (const file of files) {
            if (currentImageCount + addedCount >= MAX_IMAGES) {
                toast.error(`You can only upload a maximum of ${MAX_IMAGES} images.`);
                break; // Stop processing further files
            }
             if (!allowedTypes.includes(file.type)) {
                 toast.error(`File ${file.name} has an invalid type.`);
                 continue; // Skip this file
             }
             if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                 toast.error(`File ${file.name} exceeds ${MAX_SIZE_MB}MB limit.`);
                 continue; // Skip this file
             }
            // If validation passes
            newImagesFiles.push(file);
            newImageUrls.push({ url: URL.createObjectURL(file), name: file.name }); // Store URL and name
            addedCount++;
        }

        if (newImagesFiles.length > 0) {
            setImages(prev => [...prev, ...newImagesFiles]);
            setImageShow(prev => [...prev, ...newImageUrls]);
        }
        // Reset file input to allow selecting the same file again if needed
        e.target.value = null;
    };

    const changeImage = (file, index) => {
         if (!file) return;

         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
         const maxSizeMB = 3;

         if (!allowedTypes.includes(file.type)) { toast.error('Invalid file type.'); return; }
         if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Image exceeds ${maxSizeMB}MB limit.`); return; }

         // Create copies of state arrays
         const tempImages = [...images];
         const tempUrl = [...imageShow];

         // Revoke the old blob URL if it exists
         if (tempUrl[index] && tempUrl[index].url.startsWith('blob:')) {
             URL.revokeObjectURL(tempUrl[index].url);
         }

         // Update the arrays at the specific index
         tempImages[index] = file;
         tempUrl[index] = { url: URL.createObjectURL(file), name: file.name };

         // Set the new state
         setImages(tempImages);
         setImageShow(tempUrl);
    };

    const removeImage = (indexToRemove) => {
        // Revoke the blob URL before removing
        if (imageShow[indexToRemove] && imageShow[indexToRemove].url.startsWith('blob:')) {
            URL.revokeObjectURL(imageShow[indexToRemove].url);
        }
        setImages(prev => prev.filter((_, i) => i !== indexToRemove));
        setImageShow(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    // Cleanup blob URLs on component unmount
    useEffect(() => {
        // Store urls in a ref to access them in the cleanup function
        const urls = imageShow.map(img => img.url);
        return () => {
            // console.log("Cleaning up blob URLs");
            urls.forEach(url => {
                if (url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
        };
    }, [imageShow]); // Run cleanup when imageShow changes (for removals) or on unmount

    // --- Form Submission ---
    const handleAddProduct = (e) => {
        e.preventDefault();

        // Enhanced Validation
        if (!state.name.trim()) { toast.error("Product Name is required."); return; }
        if (!category) { toast.error("Please select a Category."); return; }
        if (!state.brand.trim()) { toast.error("Brand Name is required."); return; }
        const priceNum = parseFloat(state.price);
        const stockNum = parseInt(state.stock);
        const discountNum = parseInt(state.discount || '0');
        if (isNaN(priceNum) || priceNum <= 0) { toast.error("Valid Price is required."); return; }
        if (isNaN(stockNum) || stockNum < 0) { toast.error("Valid Stock quantity is required."); return; }
        if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) { toast.error("Discount must be between 0 and 100."); return; }
        if (!state.description.trim()) { toast.error("Description is required."); return; }
        if (images.length === 0) { toast.error("Please upload at least one Product Image."); return; }


        const formData = new FormData();
        formData.append('name', state.name.trim());
        formData.append('description', state.description.trim());
        formData.append('price', priceNum.toString()); // Send as string
        formData.append('stock', stockNum.toString());
        formData.append('discount', discountNum.toString());
        formData.append('brand', state.brand.trim());
        formData.append('category', category); // Selected category name
        // Assuming shopName comes from userInfo or a fixed source
        formData.append('shopName', userInfo?.shopInfo?.shopName || userInfo?.name || 'Default Shop');

        images.forEach(imgFile => {
            formData.append('images', imgFile); // Key should match backend expectation ('images')
        });

        // console.log("Submitting FormData:", Object.fromEntries(formData.entries())); // Debug: Log FormData content
        dispatch(add_product(formData));
    };

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto"> {/* Centered content */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Add New Product</h1>
                     <Link to='/seller/dashboard/products' className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                        <FaList size={12}/> All Products
                     </Link>
                 </div>

                <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <form onSubmit={handleAddProduct}>
                         {/* Top Row: Name, Brand, Category */}
                         <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                            <div>
                                <label htmlFor="name" className='block text-sm font-medium text-gray-300 mb-1.5'>Product Name <span className="text-rose-500">*</span></label>
                                <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.name} type="text" name='name' id='name' placeholder='Product name' required />
                            </div>
                            <div>
                                <label htmlFor="brand" className='block text-sm font-medium text-gray-300 mb-1.5'>Brand <span className="text-rose-500">*</span></label>
                                <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.brand} type="text" name='brand' id='brand' placeholder='Brand name' required/>
                            </div>
                             {/* Category Dropdown */}
                            <div className='relative'>
                                <label htmlFor="category" className='block text-sm font-medium text-gray-300 mb-1.5'>Category <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                     <input readOnly onClick={() => setCateShow(prev => !prev)} className='w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400' value={category} type="text" id='category' placeholder='-- Select Category --' required />
                                     <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${cateShow ? 'rotate-180' : ''}`} />
                                </div>
                                {/* Category Dropdown Panel */}
                                <div className={`absolute top-full left-0 mt-1 z-20 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${cateShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`}>
                                    <div className='p-2'>
                                        <input value={searchValue} onChange={categorySearch} className='w-full px-3 py-2 focus:border-cyan-500 outline-none bg-[#303650]/80 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm' type="text" placeholder='Search category...' />
                                    </div>
                                    <div className='max-h-[200px] overflow-y-auto custom-scrollbar p-2'>
                                        {allCategory.length > 0 ? ( allCategory.map((c, i) => ( <div key={c._id || i} className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-200 ${category === c.name ? 'bg-cyan-500/30 text-cyan-100 font-semibold' : 'hover:bg-[#374151]/60 text-gray-300'}`} onClick={() => { setCateShow(false); setCategory(c.name); setSearchValue(''); setAllCategory(categorys); }}> {c.name} </div> )) ) : ( <div className="px-3 py-2 text-sm text-gray-500 italic">No categories found {searchValue && `matching "${searchValue}"`}</div> )}
                                    </div>
                                </div>
                            </div>
                         </div> {/* End Name/Brand/Category Row */}

                        {/* Middle Row: Price, Stock, Discount */}
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                            <div>
                                <label htmlFor="price" className='block text-sm font-medium text-gray-300 mb-1.5'>Price (DA) <span className="text-rose-500">*</span></label>
                                <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.price} type="number" min="0" step="0.01" name='price' id='price' placeholder='e.g., 1999.90' required />
                            </div>
                            <div>
                                <label htmlFor="stock" className='block text-sm font-medium text-gray-300 mb-1.5'>Stock Quantity <span className="text-rose-500">*</span></label>
                                <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.stock} type="number" min="0" step="1" name='stock' id='stock' placeholder='e.g., 100' required />
                            </div>
                             <div>
                                <label htmlFor="discount" className='block text-sm font-medium text-gray-300 mb-1.5'>Discount (%) <span className='text-xs text-gray-500'>(0-100)</span></label>
                                <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.discount} type="number" min="0" max="100" step="1" name='discount' id='discount' placeholder='e.g., 10' />
                            </div>
                        </div> {/* End Price/Stock/Discount Row */}

                         {/* Description */}
                        <div className='mb-6'>
                            <label htmlFor="description" className='block text-sm font-medium text-gray-300 mb-1.5'>Description <span className="text-rose-500">*</span></label>
                            <textarea rows={5} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400 resize-none custom-scrollbar' onChange={inputHandle} value={state.description} name='description' id='description' placeholder='Product description...' required></textarea>
                        </div>

                         {/* Image Upload Section */}
                        <div className='mb-6'>
                             <label className='block text-sm font-medium text-gray-300 mb-2'>Product Images (Up to {MAX_IMAGES}) <span className="text-rose-500">*</span></label>
                             <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                                {imageShow.map((img, i) => (
                                    <div key={i} className='h-[120px] relative group border-2 border-gray-600/60 rounded-lg overflow-hidden shadow-sm'>
                                        <label htmlFor={`image-${i}`} className="cursor-pointer w-full h-full block">
                                             <img className='w-full h-full object-cover' src={img.url} alt={`Preview ${i+1}`} title={img.name} />
                                        </label>
                                        <input onChange={(e) => changeImage(e.target.files[0], i)} type="file" id={`image-${i}`} className='hidden' accept="image/*" />
                                        {/* Remove Button */}
                                        <button type="button" onClick={() => removeImage(i)} className='absolute top-1 right-1 p-1.5 z-10 cursor-pointer bg-rose-600/80 hover:bg-rose-700/90 text-white rounded-full text-xs leading-none transition-all duration-200 opacity-50 group-hover:opacity-100' aria-label={`Remove image ${i+1}`}>
                                            <FaXmark size={10}/>
                                        </button>
                                         {/* Change Overlay */}
                                         <label htmlFor={`image-${i}`} className="absolute inset-0 bg-black/50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                            <span className="text-white text-xs font-semibold">Change</span>
                                         </label>
                                    </div>
                                ))}
                                {/* Add Image Box */}
                                {images.length < MAX_IMAGES && (
                                    <label className='flex justify-center items-center flex-col h-[120px] cursor-pointer border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors duration-300 w-full bg-[#303650]/40 hover:bg-[#303650]/60' htmlFor="image_upload_input">
                                        <FaImages className="text-3xl mb-1" />
                                        <span className="text-xs font-semibold">Add Image</span>
                                        <span className="text-[10px]">({images.length}/{MAX_IMAGES})</span>
                                    </label>
                                )}
                                <input className='hidden' onChange={imageHandle} multiple type="file" id='image_upload_input' accept="image/*" />
                             </div>
                        </div>

                        {/* Submit Button */}
                        <div className='flex justify-end mt-8 pt-6 border-t border-gray-700/50'>
                            <button
                                type="submit"
                                disabled={productLoader} // Use the correct loader state
                                className={`w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-300 shadow-md text-base flex items-center justify-center gap-2 ${productLoader ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30'}`}
                            >
                                {productLoader ? <BeatLoader color="#ffffff" size={10}/> : <FaPlus />}
                                <span className="ml-1">{productLoader ? 'Processing...' : 'Add Product'}</span>
                            </button>
                        </div>
                    </form>
                </div>
             </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Custom Scrollbar */
                 .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                 .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 35, 55, 0.4); border-radius: 3px; }
                 .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.7); border-radius: 3px; }
                 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.9); }
                 .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(75, 85, 99, 0.7) rgba(30, 35, 55, 0.4); }
                 /* Remove Number Input Spinners */
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                 /* Select dropdown styling */
                 select option { background-color: #252A40; color: #e5e7eb; }
            `}</style>
        </div>
    );
};

export default AddProduct;