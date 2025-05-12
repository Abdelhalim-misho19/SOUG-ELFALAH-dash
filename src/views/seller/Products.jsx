import React, { useEffect, useState } from 'react';
import Search from '../components/Search'; // Assuming styled Search
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; // Assuming styled Pagination
import { FaEdit, FaEye, FaTrash, FaImage, FaPlus, FaSpinner, FaBoxOpen } from 'react-icons/fa'; // Added icons
import { LuImageMinus } from "react-icons/lu"; // Keep if preferred for banner icon
import { useDispatch, useSelector } from 'react-redux';
import { get_products, delete_product, messageClear } from '../../store/Reducers/productReducer'; // Added delete_product, messageClear
import { BeatLoader } from 'react-spinners'; // Consistent loader
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Swal from 'sweetalert2'; // For delete confirmation
import toast from 'react-hot-toast';

// Placeholder image
const defaultProductImage = '/images/product_placeholder.png'; // ADJUST PATH AS NEEDED

// Skeleton Row
const SkeletonProductRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-4"></div></td>
        <td className="py-3 px-4"><div className="h-11 w-11 bg-gray-600/50 rounded-md"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-12"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-10"></div></td>
        <td className="py-3 px-4"> <div className="flex justify-center gap-2"><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div></div></td>
    </tr>
);

const Products = () => {
    const dispatch = useDispatch();
    const {
        products = [],
        totalProduct = 0,
        loader: productLoader, // Renamed for clarity
        successMessage,
        errorMessage
    } = useSelector(state => state.product); // Ensure 'product' slice is correct

    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(10); // Show more items per page by default
    const [deletingId, setDeletingId] = useState(null); // Track which product is being deleted

    // Fetch products effect
    useEffect(() => {
        const params = { parPage: parseInt(parPage), page: parseInt(currentPage), searchValue };
        dispatch(get_products(params));
    }, [searchValue, currentPage, parPage, dispatch]);

    // Message handling effect
    useEffect(() => {
        let shouldRefetch = false;
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            if (successMessage.toLowerCase().includes('delete')) {
                 shouldRefetch = true;
                 setDeletingId(null);
            }
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            setDeletingId(null);
            dispatch(messageClear());
        }
         // Refetch if needed (e.g., after delete)
         if (shouldRefetch) {
             dispatch(get_products({ parPage: parseInt(parPage), page: currentPage, searchValue }));
         }
    }, [successMessage, errorMessage, dispatch, currentPage, parPage, searchValue]);


    // Function to handle potential image errors
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = defaultProductImage;
    };

    // Handle Product Delete Confirmation
    const handleDeleteProduct = (productId, productName) => {
        if (deletingId) return; // Prevent multiple clicks

        Swal.fire({
            title: 'Delete Product?',
            html: `Are you sure you want to delete: <br/><b>${productName || 'this product'}</b>? <br/><span class='text-xs text-red-400'>Associated banners might also be affected. This cannot be undone.</span>`,
            icon: 'warning',
            iconColor: '#f87171',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626', // Red-600
            cancelButtonColor: '#374151', // Gray-700
            background: '#1e2337',
            color: '#e5e7eb',
            customClass: {
                popup: 'border border-red-500/50 rounded-lg shadow-xl',
                confirmButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 !bg-red-600 hover:!bg-red-700',
                cancelButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 mr-2 !bg-gray-600 hover:!bg-gray-700',
            },
             showLoaderOnConfirm: true,
             preConfirm: async () => {
                 setDeletingId(productId); // Set loading state for this specific product
                 try {
                     // Pass ID correctly based on delete_product action expectation
                     // Ensure delete_product is imported and handles async correctly (e.g., returns a promise)
                     await dispatch(delete_product(productId)).unwrap();
                 } catch (error) {
                     // Error toast is handled by the useEffect, just show Swal validation message
                     Swal.showValidationMessage(`Request failed: ${error?.message || 'Could not delete product'}`);
                      setDeletingId(null); // Reset loading on failure
                 }
             },
             allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
             // Reset loading state if modal closed without confirmation
             if (!result.isConfirmed && deletingId === productId) {
                 setDeletingId(null);
             }
            // Success state clearing is handled by useEffect
         });
    };

    const isLoading = productLoader; // Use loader state from reducer

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>My Products</h1>
                     <Link to='/seller/dashboard/add-product' className='bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2'>
                         <FaPlus size={14}/> Add New Product
                     </Link>
                 </div>

                <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        {/* --- Use the updated Search component (without setParPage) --- */}
                        <Search setSearchValue={setSearchValue} searchValue={searchValue} />
                        <div className="flex items-center gap-3">
                            <label htmlFor="productParPage" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select id="productParPage" onChange={(e) => setParPage(parseInt(e.target.value))} value={parPage} className="px-3 py-1.5 w-20 rounded-md bg-[#374151]/50 border border-gray-600 text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer">
                                <option value="5">5</option> <option value="10">10</option> <option value="15">15</option> <option value="25">25</option>
                            </select>
                        </div>
                    </div>

                    <div className='relative overflow-x-auto rounded-lg border border-gray-700/50'>
                        <table className='w-full text-sm text-left text-gray-300'>
                            <thead className='text-xs uppercase text-gray-400 bg-[#303650]/50 sticky top-0 z-10'>
                                <tr>
                                    <th scope='col' className='py-3 px-4 w-12'>No</th>
                                    <th scope='col' className='py-3 px-4'>Image</th>
                                    <th scope='col' className='py-3 px-4 min-w-[200px]'>Name</th>
                                    <th scope='col' className='py-3 px-4'>Category</th>
                                    <th scope='col' className='py-3 px-4'>Brand</th>
                                    <th scope='col' className='py-3 px-4 text-right'>Price</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Disc.</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Stock</th>
                                    <th scope='col' className='py-3 px-4 min-w-[160px] text-center'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {/* Loading State */}
                                {isLoading && products.length === 0 && (
                                    Array.from({ length: parPage }).map((_, i) => <SkeletonProductRow key={`skel-${i}`} />)
                                )}

                                {/* Data Rows */}
                                {!isLoading && products.length > 0 && (
                                    products.map((d, i) => {
                                         const isDeletingCurrent = deletingId === d._id; // Check if this specific row is being deleted
                                         return (
                                            <tr key={d._id || i} className={`hover:bg-[#303650]/40 transition-colors align-middle ${isDeletingCurrent ? 'opacity-50' : ''}`}>
                                                <td className='py-3 px-4 font-medium text-gray-400'>{(currentPage - 1) * parPage + i + 1}</td>
                                                <td className='py-3 px-4'>
                                                    <img className='w-11 h-11 rounded-md object-cover border border-gray-600' src={d.images && d.images[0] ? d.images[0] : defaultProductImage} alt={d.name || 'Product'} onError={handleImageError} loading="lazy" />
                                                </td>
                                                <td className='py-3 px-4 font-medium text-gray-200 whitespace-normal break-words'>{d.name}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-300'>{d.category}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-300'>{d.brand}</td>
                                                {/* Formatting Price - Assuming 'DA' is Algerian Dinar */}
                                                <td className='py-3 px-4 whitespace-nowrap font-semibold text-emerald-400 text-right'>{(d.price || 0).toLocaleString('fr-DZ', {style:'currency', currency: 'DZD', minimumFractionDigits: 0})}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-center'> {d.discount > 0 ? ( <span className='text-amber-400 font-medium'>{d.discount}%</span> ) : ( <span className='text-gray-500 italic text-xs'>--</span> )} </td>
                                                <td className={`py-3 px-4 whitespace-nowrap text-center font-medium ${d.stock > 0 ? 'text-gray-200' : 'text-rose-400'}`}>{d.stock}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='flex justify-center items-center gap-2'>
                                                        {/* Edit Button */}
                                                        <Link to={`/seller/dashboard/edit-product/${d._id}`} className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-not-allowed' : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20'}`} data-tooltip-id="product-actions" data-tooltip-content="Edit Product" aria-disabled={isDeletingCurrent} tabIndex={isDeletingCurrent ? -1 : 0}> <FaEdit size={14}/> </Link>
                                                        {/* Manage Banner Button */}
                                                        <Link to={`/seller/dashboard/add-banner/${d._id}`} className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20'}`} data-tooltip-id="product-actions" data-tooltip-content="Manage Banner" aria-disabled={isDeletingCurrent} tabIndex={isDeletingCurrent ? -1 : 0}> <FaImage size={14}/> </Link> {/* Using FaImage */}
                                                        {/* View on Store Button */}
                                                        <Link to={`/product/details/${d.slug}`} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-not-allowed' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'}`} data-tooltip-id="product-actions" data-tooltip-content="View on Store" aria-disabled={isDeletingCurrent} tabIndex={isDeletingCurrent ? -1 : 0}> <FaEye size={14}/> </Link>
                                                        {/* Delete Button */}
                                                        <button onClick={() => handleDeleteProduct(d._id, d.name)} disabled={isDeletingCurrent} className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-wait' : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'}`} data-tooltip-id="product-actions" data-tooltip-content="Delete Product" aria-disabled={isDeletingCurrent}>
                                                             {isDeletingCurrent ? <FaSpinner className="animate-spin" size={14}/> : <FaTrash size={14}/>}
                                                         </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                                 {/* No Products Found Row */}
                                 {!isLoading && products.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="py-10 px-4 text-center text-gray-500 italic flex flex-col items-center gap-2">
                                             <FaBoxOpen size={32} className="text-gray-600"/>
                                             No products found {searchValue && `matching "${searchValue}"`}.
                                            <Link to='/seller/dashboard/add-product' className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1 font-semibold">Add your first product</Link>!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                         <Tooltip id="product-actions" place="top" style={{ backgroundColor: "#303650", color: "#e5e7eb", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", zIndex: 50 }}/>
                    </div>

                    {/* Pagination */}
                    {totalProduct > parPage && !isLoading && (
                        <div className='w-full flex justify-center sm:justify-end mt-6'>
                            <Pagination pageNumber={currentPage} setPageNumber={setCurrentPage} totalItem={totalProduct} parPage={parPage} showItem={3} />
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 td, th { vertical-align: middle; }
                 #__react_tooltip { z-index: 999 !important; }
            `}</style>
        </div>
    );
};

export default Products;