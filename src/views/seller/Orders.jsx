import React, { useEffect, useState } from 'react';
import Search from '../components/Search'; // Assuming styled Search
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; // Assuming styled Pagination
import { FaEye, FaSpinner, FaShoppingBag } from 'react-icons/fa'; // Added FaShoppingBag
import { useDispatch, useSelector } from 'react-redux';
import { get_seller_orders, messageClear } from '../../store/Reducers/OrderReducer'; // Added messageClear
import moment from 'moment';
import toast from 'react-hot-toast'; // Import toast
import { BeatLoader } from 'react-spinners'; // Consistent loader

// --- Helper: Status Badge ---
const OrderStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap border';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    if (type === 'payment') {
        colors = status?.toLowerCase() === 'paid' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    } else { // delivery status
        switch (status?.toLowerCase()) {
            case 'delivered': colors = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'; break;
            case 'cancelled': colors = 'bg-rose-500/10 text-rose-300 border-rose-500/30'; break;
            case 'processing': colors = 'bg-sky-500/10 text-sky-300 border-sky-500/30'; break;
            case 'shipped': case 'warehouse': colors = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'; break;
            case 'pending': case 'placed': default: colors = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; break;
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};

// --- Helper: Skeleton Row ---
const SkeletonOrderRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-4 px-4"><div className="h-6 bg-gray-600/50 rounded-full w-16"></div></td>
        <td className="py-4 px-4"><div className="h-6 bg-gray-600/50 rounded-full w-20"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-600/50 rounded w-24"></div></td>
        <td className="py-4 px-4 text-center"><div className="h-8 w-8 bg-gray-600/50 rounded-md mx-auto"></div></td>
    </tr>
);


const Orders = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.auth);
    // Ensure slice name 'order' and variable names match reducer
    const {
        myOrders = [], // Default to empty array
        totalOrder = 0,
        loader: orderLoader,
        errorMessage,
        successMessage // Include if used for non-fetch actions
    } = useSelector(state => state.order);

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(10); // Increase default items

    // --- Message Handling ---
    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            dispatch(messageClear());
        }
        // Only show success toast for specific actions, not usually for fetching data
        if (successMessage && !successMessage.toLowerCase().includes('fetched')) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' } });
            dispatch(messageClear());
        }
    }, [errorMessage, successMessage, dispatch]);

    // --- Fetch Bookings ---
    useEffect(() => {
        if (userInfo?._id) {
            // console.log('Seller Orders: Fetching for Seller ID:', userInfo._id, 'Page:', currentPage, 'Search:', searchValue);
            const params = {
                parPage: parseInt(parPage),
                page: parseInt(currentPage),
                searchValue,
                sellerId: userInfo._id
            };
            dispatch(get_seller_orders(params));
        } else {
            // console.log('Seller Orders: Waiting for user info...');
        }
    }, [searchValue, currentPage, parPage, userInfo?._id, dispatch]);

    // --- Formatting ---
    const formatDate = (dateString) => dateString ? moment(dateString).format('DD MMM YYYY') : 'N/A';
    // Correct currency formatting for Algerian Dinar
    const formatPrice = (price) => (price || 0).toLocaleString('fr-DZ', {style:'currency', currency: 'DZD', minimumFractionDigits: 0});


    const isLoading = orderLoader;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                 {/* Header */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>My Orders</h1>
                     {/* Optional: Add relevant links if needed */}
                 </div>

                {/* Main Content Card */}
                <div className='w-full p-5 md:p-6 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                     {/* Search and Filter */}
                     <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <Search setSearchValue={setSearchValue} searchValue={searchValue} />
                        <div className="flex items-center gap-3">
                            <label htmlFor="orderParPage" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select
                                id="orderParPage"
                                onChange={(e) => setParPage(parseInt(e.target.value))}
                                value={parPage}
                                className="px-3 py-1.5 w-20 rounded-md bg-[#374151]/50 border border-gray-600 text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
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
                                    <th scope='col' className='py-3 px-4'>Order ID</th>
                                    <th scope='col' className='py-3 px-4 text-right'>Price</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Payment</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Order Status</th>
                                    <th scope='col' className='py-3 px-4'>Date</th>
                                    <th scope='col' className='py-3 px-4 text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {/* Loading State */}
                                {isLoading && myOrders.length === 0 && (
                                    Array.from({ length: parPage }).map((_, i) => <SkeletonOrderRow key={`skel-${i}`} />)
                                )}

                                {/* Data Rows */}
                                {!isLoading && myOrders.length > 0 && (
                                    myOrders.map((d) => ( // Use d instead of booking
                                        <tr key={d._id} className="hover:bg-[#303650]/40 transition-colors align-middle">
                                            <td className='py-3 px-4 font-mono text-gray-400'>#{d._id.slice(-6).toUpperCase()}</td>
                                            <td className='py-3 px-4 whitespace-nowrap font-semibold text-emerald-400 text-right'>{formatPrice(d.price)}</td>
                                            <td className='py-3 px-4 text-center'> <OrderStatusBadge status={d.payment_status} type="payment" /> </td>
                                            <td className='py-3 px-4 text-center'> <OrderStatusBadge status={d.delivery_status} type="delivery" /> </td>
                                            <td className='py-3 px-4 whitespace-nowrap text-gray-400'>{formatDate(d.createdAt || d.date)}</td> {/* Use createdAt or date */}
                                            <td className='py-3 px-4 text-center'>
                                                <Link
                                                    to={`/seller/dashboard/order/details/${d._id}`} // Path for order details
                                                    className='p-2 inline-flex items-center justify-center text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-md transition-all duration-200'
                                                    title="View Order Details"
                                                    aria-label={`View details for order ${d._id.slice(-6)}`}
                                                >
                                                    <FaEye size={14}/>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* No Orders Found */}
                                {!isLoading && myOrders.length === 0 && (
                                     <tr>
                                        <td colSpan="6" className="py-10 px-4 text-center text-gray-500 italic flex flex-col items-center gap-2">
                                             <FaShoppingBag size={32} className="text-gray-600"/> {/* Changed Icon */}
                                             No orders found {searchValue && `matching "${searchValue}"`}.
                                        </td>
                                    </tr>
                                 )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                     {totalOrder > parPage && !isLoading && (
                        <div className='w-full flex justify-center sm:justify-end mt-6'>
                            <Pagination
                                pageNumber={currentPage}
                                setPageNumber={setCurrentPage}
                                totalItem={totalOrder}
                                parPage={parPage}
                                showItem={3}
                                // theme="dark" // Apply theme if supported
                            />
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
            `}</style>
        </div>
    );
};

export default Orders; // Renamed component