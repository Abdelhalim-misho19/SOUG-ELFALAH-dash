import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; // Assuming styled
import { FaEye, FaSpinner, FaCalendarCheck } from 'react-icons/fa'; // Added FaCalendarCheck
import { useDispatch, useSelector } from 'react-redux';
import Search from '../components/Search'; // Assuming styled
import { get_seller_bookings, messageClear } from '../../store/Reducers/BookingReducer'; // Ensure path is correct
import { BeatLoader } from 'react-spinners'; // Consistent loader
import moment from 'moment';
import toast from 'react-hot-toast';

// --- Helper: Status Badge ---
// Reusable status badge component
const BookingStatusBadge = ({ status }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap border';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

    switch (status?.toLowerCase()) {
        case 'confirmed':
        case 'completed':
             colors = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; break;
        case 'pending':
             colors = 'bg-amber-500/20 text-amber-300 border-amber-500/30'; break;
         case 'processing': // Example additional status
             colors = 'bg-sky-500/20 text-sky-300 border-sky-500/30'; break;
        case 'cancelled':
        case 'rejected':
             colors = 'bg-rose-500/20 text-rose-300 border-rose-500/30'; break;
        default:
            colors = 'bg-gray-500/20 text-gray-400 border-gray-500/30'; break;
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};

// --- Helper: Skeleton Row ---
const SkeletonBookingRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-24"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-4 px-4"><div className="h-6 bg-gray-600/50 rounded-full w-20"></div></td>
        <td className="py-4 px-4 text-center"><div className="h-8 w-8 bg-gray-600/50 rounded-md mx-auto"></div></td>
    </tr>
);

const SellerBookings = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.auth);
    const {
        sellerBookings = [], // Default to empty array
        totalBookings = 0,
        loader: bookingLoader,
        errorMessage,
        successMessage
    } = useSelector(state => state.booking); // Ensure 'booking' slice name is correct

    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(5);

    // --- Message Handling ---
     useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            dispatch(messageClear());
        }
        if (successMessage && !successMessage.toLowerCase().includes('fetched')) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            dispatch(messageClear());
        }
     }, [errorMessage, successMessage, dispatch]);

    // --- Fetch Bookings ---
    useEffect(() => {
        if (userInfo?._id) {
            const params = {
                parPage: parseInt(parPage),
                page: parseInt(currentPage),
                searchValue,
                sellerId: userInfo._id
            };
            dispatch(get_seller_bookings(params));
        }
    }, [searchValue, currentPage, parPage, userInfo?._id, dispatch]);

    // --- Formatting ---
    const formatDate = (dateString) => dateString ? moment(dateString).format('DD MMM YYYY') : 'N/A';
    const formatTime = (timeString) => timeString ? moment(timeString, "HH:mm").format('hh:mm A') : 'N/A'; // Correct 12-hr format

    const isLoading = bookingLoader; // Use loader state from reducer

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                 {/* Header */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>
                        Service Bookings
                     </h1>
                     {/* Optional: Add other relevant links or actions */}
                 </div>

                {/* Main Content Card */}
                <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                     {/* Search and Filter */}
                     <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <Search
                            setSearchValue={setSearchValue}
                            searchValue={searchValue}
                            // Optional styling props if supported
                        />
                        <div className="flex items-center gap-3">
                            <label htmlFor="bookingParPage" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select
                                id="bookingParPage" // Unique ID
                                onChange={(e) => setParPage(parseInt(e.target.value))}
                                value={parPage}
                                className="px-3 py-1.5 w-20 rounded-md bg-[#374151]/50 border border-gray-600 text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                            </select>
                        </div>
                    </div>

                     {/* Bookings Table Container */}
                    <div className='relative overflow-x-auto rounded-lg border border-gray-700/50'>
                        <table className='w-full text-sm text-left text-gray-300'>
                            <thead className='text-xs uppercase text-gray-400 bg-[#303650]/50 sticky top-0 z-10'>
                                <tr>
                                    <th scope='col' className='py-3 px-4'>Booking ID</th>
                                    <th scope='col' className='py-3 px-4'>Customer</th>
                                    <th scope='col' className='py-3 px-4 min-w-[180px]'>Service</th> {/* Wider for service */}
                                    <th scope='col' className='py-3 px-4'>Date</th>
                                    <th scope='col' className='py-3 px-4'>Time</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Status</th> {/* Centered */}
                                    <th scope='col' className='py-3 px-4 text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {/* --- Loading State --- */}
                                {isLoading && sellerBookings.length === 0 && (
                                    Array.from({ length: parPage }).map((_, i) => <SkeletonBookingRow key={`skel-${i}`} />)
                                )}

                                {/* --- Data Rows --- */}
                                {!isLoading && sellerBookings.length > 0 && (
                                    sellerBookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-[#303650]/40 transition-colors align-middle">
                                            <td className='py-3 px-4 font-mono text-gray-400'>#{booking._id.slice(-6).toUpperCase()}</td>
                                            <td className='py-3 px-4 font-medium text-gray-200 whitespace-nowrap'>{booking.userName || 'N/A'}</td>
                                            <td className='py-3 px-4 text-gray-300 whitespace-normal break-words'>{booking.serviceName || 'N/A'}</td> {/* Allow wrap */}
                                            <td className='py-3 px-4 whitespace-nowrap text-gray-400'>{formatDate(booking.date)}</td>
                                            <td className='py-3 px-4 whitespace-nowrap text-gray-400'>{formatTime(booking.time)}</td>
                                            <td className='py-3 px-4 text-center'> {/* Centered */}
                                                <BookingStatusBadge status={booking.status} />
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <Link
                                                    to={`/seller/dashboard/booking/details/${booking._id}`} // Ensure this path exists
                                                    className='p-2 inline-flex items-center justify-center text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-all duration-200'
                                                    title="View Booking Details"
                                                    aria-label={`View details for booking ${booking._id.slice(-6)}`}
                                                >
                                                    <FaEye size={14}/>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* --- No Bookings Found --- */}
                                {!isLoading && sellerBookings.length === 0 && (
                                     <tr>
                                        <td colSpan="7" className="py-10 px-4 text-center text-gray-500 italic flex flex-col items-center gap-2">
                                             <FaCalendarCheck size={32} className="text-gray-600"/>
                                             No bookings found {searchValue && `matching "${searchValue}"`}.
                                        </td>
                                    </tr>
                                 )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination --- */}
                     {totalBookings > parPage && !isLoading && ( // Hide pagination during initial load
                        <div className='w-full flex justify-center sm:justify-end mt-6'>
                            <Pagination
                                pageNumber={currentPage}
                                setPageNumber={setCurrentPage}
                                totalItem={totalBookings}
                                parPage={parPage}
                                showItem={3}
                                // theme="dark" // If pagination supports theming
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Table Alignment */
                 td, th { vertical-align: middle; }
            `}</style>
        </div>
    );
};

export default SellerBookings;