import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; // Assuming styled
import { FaEdit, FaTrash, FaEye, FaSpinner, FaPlus, FaConciergeBell } from 'react-icons/fa'; // Using FaConciergeBell as generic service icon
import { Tooltip } from 'react-tooltip'; // Use react-tooltip
import 'react-tooltip/dist/react-tooltip.css'; // Tooltip CSS
import { useDispatch, useSelector } from 'react-redux';
import { get_services, messageClear, delete_service } from '../../store/Reducers/serviceReducer'; // Ensure path and action names are correct
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'; // For delete confirmation
import Search from '../components/Search'; // Assuming styled Search
import { BeatLoader } from 'react-spinners'; // Consistent loader

// Placeholder image
const defaultServiceImage = '/images/service_placeholder.png'; // ADJUST PATH AS NEEDED

// Skeleton Row
const SkeletonServiceRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-4"></div></td>
        <td className="py-3 px-4"><div className="h-11 w-11 bg-gray-600/50 rounded-md"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-24"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-24"></div></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-600/50 rounded w-32"></div></td>
        <td className="py-3 px-4"> <div className="flex justify-center gap-2"><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div><div className="h-8 w-8 bg-gray-600/50 rounded-md"></div></div></td>
    </tr>
);

const AllServices = () => {
    const dispatch = useDispatch();
    // Ensure slice name 'service' and state variables match reducer
    const {
        services = [],
        totalService = 0,
        loader: serviceLoader,
        errorMessage,
        successMessage,
        // Add action-specific loader if available, e.g., loadingDelete
    } = useSelector(state => state.service);

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(10); // Show more by default
    const [deletingId, setDeletingId] = useState(null); // Track delete state

    // --- Fetch Services ---
    useEffect(() => {
        const params = { parPage: parseInt(parPage), page: parseInt(currentPage), searchValue };
        dispatch(get_services(params));
    }, [searchValue, currentPage, parPage, dispatch]);

    // --- Handle Messages ---
    useEffect(() => {
        let shouldRefetch = false;
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            if (successMessage.toLowerCase().includes('delete')) {
                 shouldRefetch = true;
                 setDeletingId(null); // Reset delete loader
            }
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            setDeletingId(null); // Reset delete loader
            dispatch(messageClear());
        }
         if (shouldRefetch) {
             dispatch(get_services({ parPage: parseInt(parPage), page: currentPage, searchValue }));
         }
    }, [successMessage, errorMessage, dispatch, currentPage, parPage, searchValue]);

    // --- Delete Handler ---
    const handleDeleteService = (serviceId, serviceName) => {
        if (deletingId) return; // Prevent multiple clicks

        Swal.fire({
            title: 'Delete Service?',
            html: `Are you sure you want to delete: <br/><b>${serviceName || 'this service'}</b>? <br/><span class='text-xs text-red-400'>This cannot be undone.</span>`,
            icon: 'warning',
            iconColor: '#f87171',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#374151',
            background: '#1e2337',
            color: '#e5e7eb',
            customClass: { /* ... your sweetalert dark theme styles ... */
                 popup: 'border border-red-500/50 rounded-lg shadow-xl',
                 confirmButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 !bg-red-600 hover:!bg-red-700',
                 cancelButton: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 mr-2 !bg-gray-600 hover:!bg-gray-700',
             },
             showLoaderOnConfirm: true,
             preConfirm: async () => {
                 setDeletingId(serviceId);
                 try {
                     await dispatch(delete_service(serviceId)).unwrap(); // Assuming delete action takes ID
                 } catch (error) {
                     Swal.showValidationMessage(`Request failed: ${error?.message || 'Could not delete service'}`);
                     setDeletingId(null);
                 }
             },
             allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
             if (!result.isConfirmed && deletingId === serviceId) {
                 setDeletingId(null); // Reset if cancelled
             }
         });
    };

    // Image error handler
    const handleImageError = (e) => { e.target.onerror = null; e.target.src = defaultServiceImage; };

    // Format price
    const formatPrice = (price) => (price || 0).toLocaleString('fr-DZ', {style:'currency', currency: 'DZD', minimumFractionDigits: 0});

    const isLoading = serviceLoader; // Use the loader from the service state

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                 {/* Header */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>My Services</h1>
                     <Link to="/seller/dashboard/add-service" className='bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2'>
                        <FaPlus size={14}/> Add New Service
                     </Link>
                 </div>

                {/* Main Content Card */}
                <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <Search setSearchValue={setSearchValue} searchValue={searchValue} />
                        <div className="flex items-center gap-3">
                            <label htmlFor="serviceParPage" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select id="serviceParPage" onChange={(e) => setParPage(parseInt(e.target.value))} value={parPage} className="px-3 py-1.5 w-20 rounded-md bg-[#374151]/50 border border-gray-600 text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer">
                                <option value="5">5</option> <option value="10">10</option> <option value="15">15</option> <option value="25">25</option>
                            </select>
                        </div>
                    </div>

                    {/* Services Table Container */}
                    <div className='relative overflow-x-auto rounded-lg border border-gray-700/50'>
                        <table className='w-full text-sm text-left text-gray-300'>
                            <thead className='text-xs uppercase text-gray-400 bg-[#303650]/50 sticky top-0 z-10'>
                                <tr>
                                    <th scope='col' className='py-3 px-4 w-12'>No</th>
                                    <th scope='col' className='py-3 px-4'>Image</th>
                                    <th scope='col' className='py-3 px-4 min-w-[180px]'>Name</th>
                                    <th scope='col' className='py-3 px-4'>Category</th>
                                    <th scope='col' className='py-3 px-4 text-right'>Price</th> {/* Right align price */}
                                    <th scope='col' className='py-3 px-4'>Phone</th>
                                    <th scope='col' className='py-3 px-4 min-w-[150px]'>Location</th>
                                    <th scope='col' className='py-3 px-4 min-w-[120px] text-center'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {/* Loading State */}
                                {isLoading && services.length === 0 && (
                                    Array.from({ length: parPage }).map((_, i) => <SkeletonServiceRow key={`skel-${i}`} />)
                                )}

                                {/* Data Rows */}
                                {!isLoading && services.length > 0 && (
                                    services.map((s, i) => {
                                        const isDeletingCurrent = deletingId === s._id;
                                        const locationString = `${s.municipality || ''}${s.municipality && s.province ? ', ' : ''}${s.province || ''}`;
                                        return (
                                            <tr key={s._id} className={`hover:bg-[#303650]/40 transition-colors align-middle ${isDeletingCurrent ? 'opacity-50' : ''}`}>
                                                <td className='py-3 px-4 font-medium text-gray-400'>{(currentPage - 1) * parPage + i + 1}</td>
                                                <td className='py-3 px-4'>
                                                    <img className='w-11 h-11 rounded-md object-cover border border-gray-600' src={s.images && s.images[0] ? s.images[0] : defaultServiceImage} alt={s.name || 'Service'} onError={handleImageError} loading="lazy" />
                                                </td>
                                                <td className='py-3 px-4 font-medium text-gray-200 whitespace-normal break-words'>{s.name}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-300'>{s.category}</td>
                                                <td className='py-3 px-4 whitespace-nowrap font-semibold text-emerald-400 text-right'>{formatPrice(s.price)}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-300 font-mono text-xs'>{s.phoneNumber}</td>
                                                <td className='py-3 px-4 whitespace-nowrap text-gray-300 truncate' title={locationString}> {locationString || <span className="italic text-gray-500">N/A</span>} </td>
                                                <td className='py-3 px-4'>
                                                    <div className='flex justify-center items-center gap-2'>
                                                        <Link to={`/seller/dashboard/edit-service/${s._id}`} className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-not-allowed' : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20'}`} data-tooltip-id="service-actions" data-tooltip-content="Edit Service" aria-disabled={isDeletingCurrent} tabIndex={isDeletingCurrent ? -1 : 0}> <FaEdit size={14}/> </Link>
                                                        {/* Remove View button if no dedicated details page exists */}
                                                        {/* <button className='p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-colors duration-200 cursor-not-allowed opacity-60' data-tooltip-id="service-actions" data-tooltip-content="View Details"> <FaEye size={14}/> </button> */}
                                                        <button onClick={() => handleDeleteService(s._id, s.name)} disabled={isDeletingCurrent} className={`p-2 rounded-md transition-colors duration-200 ${isDeletingCurrent ? 'text-gray-500 bg-gray-600/10 cursor-wait' : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'}`} data-tooltip-id="service-actions" data-tooltip-content="Delete Service" aria-disabled={isDeletingCurrent}>
                                                             {isDeletingCurrent ? <FaSpinner className="animate-spin" size={14}/> : <FaTrash size={14}/>}
                                                         </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                 {/* Empty State Row */}
                                 {!isLoading && services.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-10 px-4 text-center text-gray-500 italic flex flex-col items-center gap-2">
                                             <FaConciergeBell size={32} className="text-gray-600"/> {/* Changed Icon */}
                                             No services found {searchValue && `matching "${searchValue}"`}.
                                            <Link to='/seller/dashboard/add-service' className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1 font-semibold">Add your first service</Link>!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                         <Tooltip id="service-actions" place="top" style={{ backgroundColor: "#303650", color: "#e5e7eb", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", zIndex: 50 }}/>
                    </div>

                    {/* Pagination */}
                    {totalService > parPage && !isLoading && (
                        <div className='w-full flex justify-center sm:justify-end mt-6'>
                            <Pagination pageNumber={currentPage} setPageNumber={setCurrentPage} totalItem={totalService} parPage={parPage} showItem={3} />
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
                 /* Table Alignment */
                  td, th { vertical-align: middle; }
                 /* SweetAlert Styles */
                .swal2-popup { background-color: #1e2337 !important; color: #e5e7eb !important; border-color: #f87171 !important; border-radius: 0.5rem !important; }
                .swal2-title { color: #e5e7eb !important; }
                .swal2-html-container { color: #d1d5db !important; }
                .swal2-confirm, .swal2-cancel { border-radius: 0.375rem !important; }
                 #__react_tooltip { z-index: 999 !important; }
            `}</style>
        </div>
    );
};

export default AllServices;