import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
// Import primarily from fa6
import { FaImages, FaList, FaChevronDown, FaXmark, FaSpinner, FaPen, FaPlus, FaArrowLeft } from "react-icons/fa6";
// Import specific icons potentially missing from fa6 from fa
import { FaEdit, FaSave } from "react-icons/fa"; // <-- Import FaSave and FaEdit from fa
import { useDispatch, useSelector } from 'react-redux';
import { get_category } from '../../store/Reducers/categoryReducer'; // Adjust path/names if needed
import { get_product, update_product, messageClear, product_image_update } from '../../store/Reducers/productReducer'; // Adjust path/names if needed
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// Placeholder image
const defaultProductImage = '/images/product_placeholder.png'; // ADJUST PATH AS NEEDED

const EditProduct = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // --- Redux State ---
    const { categorys = [] } = useSelector(state => state.category);
    const {
        product,
        loader: productActionLoader,
        successMessage,
        errorMessage,
        loading: productLoading
    } = useSelector(state => state.product);

    // --- Form State ---
    const [state, setState] = useState({ name: "", description: '', discount: '', price: "", brand: "", stock: "" });
    const [category, setCategory] = useState('');
    const [imageShow, setImageShow] = useState([]);
    const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

    // --- Category Dropdown State ---
    const [cateShow, setCateShow] = useState(false);
    const [allCategory, setAllCategory] = useState([]);
    const [searchValue, setSearchValue] = useState(''); // State for category search input

    // --- Fetch Initial Data ---
    useEffect(() => {
        dispatch(get_category({ searchValue: '', parPage: '', page: "" }));
        if (productId) {
            dispatch(get_product(productId));
        }
         return () => { dispatch(messageClear()); } // Cleanup messages
    }, [productId, dispatch]);

    // --- Populate Form When Product Data Loads ---
    useEffect(() => {
        if (product) {
            setState({
                name: product.name || "", description: product.description || '',
                discount: product.discount?.toString() || '0',
                price: product.price?.toString() || '', stock: product.stock?.toString() || '',
                brand: product.brand || ""
            });
            setCategory(product.category || '');
            setImageShow(Array.isArray(product.images) ? product.images : []);
        }
    }, [product]);

    // --- Update Local Category List ---
    useEffect(() => { if (Array.isArray(categorys)) setAllCategory(categorys); }, [categorys]);

    // --- Reset Form Function (Optional) ---
    // const resetForm = useCallback(() => { /* ... */ }, [categorys]);

    // --- Handle Messages ---
     const handleMessages = useCallback(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            dispatch(messageClear());
            setUploadingImageIndex(null);
             // Refetch after success to ensure data consistency
             if (productId && (successMessage.includes('Updated') || successMessage.includes('Image Updated'))) {
                  dispatch(get_product(productId));
             }
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            setUploadingImageIndex(null);
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, productId]); // Added productId

    useEffect(() => { handleMessages(); }, [handleMessages]);

    // --- Input Handling ---
    const inputHandle = (e) => {
         const { name, value } = e.target; let processedValue = value;
         if (['price', 'stock', 'discount'].includes(name)) {
              processedValue = value.replace(/[^0-9.]/g, '');
              if (name === 'stock') processedValue = value.replace(/[^0-9]/g, '');
              if (parseFloat(processedValue) < 0) processedValue = '0';
              if (name === 'discount') processedValue = Math.max(0, Math.min(100, parseInt(processedValue || '0'))).toString();
         }
         setState(prev => ({ ...prev, [name]: processedValue }));
    };

    // --- Category Search ---
    const categorySearch = (e) => {
        const value = e.target.value; setSearchValue(value); const source = categorys || []; const filtered = source.filter(c => c.name.toLowerCase().includes(value.toLowerCase())); setAllCategory(filtered);
    };

    // --- Image Update Handling ---
    const changeImage = async (oldImgUrl, files, index) => {
        if (files && files.length > 0) {
            const file = files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const maxSizeMB = 3;
            if (!allowedTypes.includes(file.type)) { toast.error('Invalid image type.'); return; }
            if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Image exceeds ${maxSizeMB}MB.`); return; }

            setUploadingImageIndex(index);
            try {
                await dispatch(product_image_update({ oldImage: oldImgUrl, newImage: file, productId })).unwrap();
                // Message handling useEffect will clear loader
            } catch (err) {
                console.error("Image update failed:", err);
                setUploadingImageIndex(null); // Clear loader on error
            }
             // Clear file input
             const fileInput = document.getElementById(`image-${index}`);
             if (fileInput) fileInput.value = null;
        }
    };

    // --- Form Submission for Product Details ---
    const handleUpdateProduct = (e) => {
        e.preventDefault();
        // Basic Validation
        if (!state.name.trim() || !category || !state.brand.trim() || !state.price || !state.stock || !state.description.trim()) { toast.error("Please fill all required fields (*)."); return; }
        const priceNum = parseFloat(state.price); const stockNum = parseInt(state.stock);
        if (isNaN(priceNum) || priceNum <= 0) { toast.error("Valid Price required."); return; }
        if (isNaN(stockNum) || stockNum < 0) { toast.error("Valid Stock required."); return; }

        const dataToUpdate = {
            name: state.name.trim(), description: state.description.trim(),
            discount: parseInt(state.discount || '0').toString(), price: priceNum.toString(),
            brand: state.brand.trim(), stock: stockNum.toString(), category: category,
            productId: productId
        };
        dispatch(update_product(dataToUpdate));
    };

    // --- Image Error Handler ---
    const handleImageError = (e) => { e.target.onerror = null; e.target.src = defaultProductImage; };

    // --- RENDER STATES ---
    if (productLoading && !product) { return ( <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center'> <BeatLoader color="#a855f7" size={15} /> </div> ); }
    if (!productLoading && !product && productId) { return ( <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex flex-col justify-center items-center text-center'> <h2 className="text-xl text-red-400 mb-4">{errorMessage || "Product Not Found"}</h2> <p className="text-gray-400 mb-6">Could not load details.</p> <button onClick={() => navigate('/seller/dashboard/products')} className='bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2'> <FaArrowLeft size={14}/> Back to Products </button> </div> ); }
    if (!product) return null;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Edit Product</h1>
                     <Link to='/seller/dashboard/products' className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'> <FaList size={12}/> All Products </Link>
                 </div>

                <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <form onSubmit={handleUpdateProduct}>
                         {/* Name & Brand Row */}
                         <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                             <div className="md:col-span-2"> <label htmlFor="name" className='block text-sm font-medium text-gray-300 mb-1.5'>Product Name <span className="text-rose-500">*</span></label> <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.name} type="text" name='name' id='name' placeholder='Product name' required /> </div>
                            <div> <label htmlFor="brand" className='block text-sm font-medium text-gray-300 mb-1.5'>Brand <span className="text-rose-500">*</span></label> <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.brand} type="text" name='brand' id='brand' placeholder='Brand name' required/> </div>
                         </div>

                         {/* Category, Stock, Price, Discount Row */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
                             <div className='relative'> <label htmlFor="category-input" className='block text-sm font-medium text-gray-300 mb-1.5'>Category <span className="text-rose-500">*</span></label> <div className="relative"> <input id="category-input" readOnly onClick={() => setCateShow(prev => !prev)} className='w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400' value={category} type="text" placeholder='-- Select Category --' required aria-haspopup="listbox" aria-expanded={cateShow} /> <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${cateShow ? 'rotate-180' : ''}`} /> </div> {/* Category Dropdown Panel */} <div className={`absolute top-full left-0 right-0 mt-1 z-30 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${cateShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`} role="listbox" aria-labelledby="category-input"> <div className='p-2'> <input value={searchValue} onChange={categorySearch} className='w-full px-3 py-2 focus:border-cyan-500 outline-none bg-[#1e2337]/70 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm' type="text" placeholder='Search category...' aria-controls="category-listbox"/> </div> <div id="category-listbox" className='max-h-[200px] overflow-y-auto custom-scrollbar p-2'> {Array.isArray(allCategory) && allCategory.length > 0 ? ( allCategory.map((c, i) => ( <div key={c._id || i} className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-200 ${category === c.name ? 'bg-cyan-500/30 text-cyan-100 font-semibold' : 'hover:bg-[#374151]/60 text-gray-300'}`} onClick={() => { setCateShow(false); setCategory(c.name); setSearchValue(''); setAllCategory(categorys || []); }} role="option" aria-selected={category === c.name} tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { setCateShow(false); setCategory(c.name); setSearchValue(''); setAllCategory(categorys || []);} }}> {c.name} </div> )) ) : ( <div className="px-3 py-2 text-sm text-gray-500 italic">No categories {searchValue ? `matching "${searchValue}"` : 'found'}.</div> )} </div> </div> </div>
                            <div> <label htmlFor="stock" className='block text-sm font-medium text-gray-300 mb-1.5'>Stock Qty <span className="text-rose-500">*</span></label> <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.stock} type="number" min="0" step="1" name='stock' id='stock' placeholder='e.g., 100' required /> </div>
                            <div> <label htmlFor="price" className='block text-sm font-medium text-gray-300 mb-1.5'>Price (DZD) <span className="text-rose-500">*</span></label> <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.price} type="number" min="0" step="any" name='price' id='price' placeholder='e.g., 1999.90' required /> </div>
                            <div> <label htmlFor="discount" className='block text-sm font-medium text-gray-300 mb-1.5'>Discount (%) <span className='text-xs text-gray-500'>(0-100)</span></label> <input className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' onChange={inputHandle} value={state.discount} type="number" min="0" max="100" step="1" name='discount' id='discount' placeholder='e.g., 10' /> </div>
                         </div>
                        <div className='mb-6'> <label htmlFor="description" className='block text-sm font-medium text-gray-300 mb-1.5'>Description <span className="text-rose-500">*</span></label> <textarea rows={5} className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400 resize-none custom-scrollbar' onChange={inputHandle} value={state.description} name='description' id='description' placeholder='Detailed product description...' required></textarea> </div>

                        {/* Image Upload Section */}
                        <div className='mb-6'>
                             <label className='block text-sm font-medium text-gray-300 mb-2'>Product Images (Click Image to Change)</label>
                             <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                                {imageShow.map((imgUrl, i) => (
                                    <div key={i} className='h-[120px] relative group border-2 border-gray-600/60 rounded-lg overflow-hidden shadow-sm bg-[#303650]/30'>
                                        <input onChange={(e) => changeImage(imgUrl, e.target.files, i)} type="file" id={`image-${i}`} className='hidden' accept="image/*" />
                                        <img className='w-full h-full object-cover' src={imgUrl || defaultProductImage} alt={`Product ${i + 1}`} onError={handleImageError} />
                                         <label htmlFor={`image-${i}`} className="absolute inset-0 bg-black/60 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                             {/* Show Loader or Pen Icon */}
                                             {productActionLoader && uploadingImageIndex === i ? ( <BeatLoader color="#ffffff" size={8} /> ) : ( <FaPen className="text-white text-xl" /> )}
                                         </label>
                                         {/* Loader for specific image (Alternative display - can remove if above is preferred) */}
                                         {/* {productActionLoader && uploadingImageIndex === i && ( <div className="absolute inset-0 bg-[#1a1a2e]/80 flex justify-center items-center z-20"> <BeatLoader color="#00e5ff" size={8} /> </div> )} */}
                                    </div>
                                ))}
                                {imageShow.length === 0 && !productLoading && ( <div className="col-span-full text-center py-6 text-gray-500 italic">No images currently uploaded for this product.</div> )}
                                 {/* Optional: Add button/area to upload *additional* images if needed */}
                             </div>
                              <p className="text-xs text-gray-500 mt-2">Note: Click an existing image to select a new file and replace it. Images update individually.</p>
                        </div>

                        {/* Submit Button */}
                        <div className='flex justify-end mt-8 pt-6 border-t border-gray-700/50'>
                            <button
                                type="submit"
                                disabled={productActionLoader || uploadingImageIndex !== null} // Disable if updating details OR any image
                                className={`w-full sm:w-auto bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-300 shadow-md text-base flex items-center justify-center gap-2 ${ (productActionLoader || uploadingImageIndex !== null) ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/30' }`}
                            >
                                {/* Use FaSave from 'fa' */}
                                {productActionLoader && uploadingImageIndex === null ? <BeatLoader color="#ffffff" size={10}/> : <FaSave />}
                                <span className="ml-1">{productActionLoader && uploadingImageIndex === null ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </form>
                </div>
             </div>

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

export default EditProduct;