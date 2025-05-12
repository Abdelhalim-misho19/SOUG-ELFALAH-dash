import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom'; // Added Link
import { admin_order_status_update, get_admin_order, messageClear } from '../../store/Reducers/OrderReducer';
import toast from 'react-hot-toast';
import moment from 'moment';
import { MdOutlineReceiptLong, MdOutlineLocalShipping, MdPayment, MdShoppingBag, MdStorefront } from 'react-icons/md'; // Added icons
import { BeatLoader } from 'react-spinners'; // Or your preferred loader

// --- Re-use or Import OrderStatusBadge ---
const OrderStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
    if (type === 'payment') {
        colors = status?.toLowerCase() === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else { // delivery status
        switch (status?.toLowerCase()) {
            case 'delivered': colors = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'; break;
            case 'cancelled': colors = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'; break;
            case 'processing': colors = 'bg-sky-500/20 text-sky-300 border border-sky-500/30'; break;
            case 'shipped': case 'warehouse': case 'placed': // Group similar statuses if needed
                 colors = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'; break;
            case 'pending': default: colors = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; break;
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};
// --- End OrderStatusBadge ---


const OrderDetails = () => {
    const { orderId } = useParams();
    const dispatch = useDispatch();
    // Add loading state from reducer if available, otherwise derive simply
    const { order, errorMessage, successMessage, loadingOrderDetails } = useSelector((state) => state.order);

    const [status, setStatus] = useState('');
    const [initialStatus, setInitialStatus] = useState(''); // Track initial status

    useEffect(() => {
        dispatch(get_admin_order(orderId));
    }, [orderId, dispatch]);

    useEffect(() => {
        if (order) {
            setStatus(order.delivery_status || ''); // Handle null/undefined status
            setInitialStatus(order.delivery_status || '');
        }
    }, [order]);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(messageClear());
            if (order && successMessage.includes('Updated')) { // Update initial status on successful API update
                 setInitialStatus(order.delivery_status);
            }
        }
        if (errorMessage) {
            toast.error(errorMessage);
            dispatch(messageClear());
            // Optionally reset local status if update failed
            // setStatus(initialStatus);
        }
    }, [successMessage, errorMessage, dispatch, order, initialStatus]); // Include initialStatus if resetting on error

    const handleStatusUpdate = (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus); // Update local state immediately for responsiveness
        dispatch(admin_order_status_update({ orderId, info: { status: newStatus } }));
    };

    // Loading State
    // Use dedicated loading flag if available, otherwise check if order is null/undefined
    const isLoading = loadingOrderDetails === undefined ? !order : loadingOrderDetails;

    if (isLoading) {
        return (
             <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center">
                <BeatLoader color="#34d399" size={15} />
            </div>
        );
    }

     if (!order && !isLoading) {
         return (
              <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center text-center">
                 <div className="p-6 bg-[#252A40]/70 rounded-lg border border-red-700 shadow-lg">
                    <h2 className="text-xl text-red-300 mb-2">Order Not Found</h2>
                    <p className="text-gray-400">Could not load details for this order.</p>
                     <Link to="/admin/dashboard/orders" className="mt-4 inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm transition-colors">
                         Back to Orders
                     </Link>
                 </div>
             </div>
         );
     }

    // --- RENDER COMPONENT ---
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight mb-1 flex items-center gap-2">
                           <MdOutlineReceiptLong /> Order Details
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                           <span className="font-mono bg-[#303650]/50 px-2 py-0.5 rounded">#{order?._id?.toUpperCase()}</span>
                            <span>|</span>
                            <span>{order?.date ? moment(order.date).format('DD MMM YYYY, h:mm A') : 'N/A'}</span>
                        </div>
                    </div>
                    {/* Status Update Dropdown */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                         <label htmlFor="orderStatusSelect" className="text-sm font-medium text-gray-400 whitespace-nowrap">Update Status:</label>
                        <select
                            id="orderStatusSelect"
                            onChange={handleStatusUpdate}
                            value={status}
                            className="px-3 py-1.5 min-w-[150px] rounded-md bg-[#374151]/50 border border-gray-600 text-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            // Disable if status hasn't changed? Or let backend handle it.
                            // disabled={status === initialStatus}
                        >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                             {/* Add other relevant statuses like warehouse, placed if used */}
                             {/* <option value="warehouse">Warehouse</option> */}
                             {/* <option value="placed">Placed</option> */}
                        </select>
                    </div>
                </div>

                {/* Main Content Grid/Flex */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                    {/* Left Column: Shipping, Payment, Products */}
                    <div className="w-full lg:w-4/12 xl:w-1/3 flex flex-col gap-6 lg:gap-8">

                        {/* Shipping Info Panel */}
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                <MdOutlineLocalShipping className="text-sky-400" /> Shipping Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p><strong className="text-gray-400 font-medium w-20 inline-block">Name:</strong> {order?.shippingInfo?.name || 'N/A'}</p>
                                <p><strong className="text-gray-400 font-medium w-20 inline-block">Address:</strong> {order?.shippingInfo?.address || 'N/A'}</p>
                                <p><strong className="text-gray-400 font-medium w-20 inline-block">City:</strong> {order?.shippingInfo?.city || 'N/A'}</p>
                                <p><strong className="text-gray-400 font-medium w-20 inline-block">Province:</strong> {order?.shippingInfo?.province || 'N/A'}</p>
                                <p><strong className="text-gray-400 font-medium w-20 inline-block">Area:</strong> {order?.shippingInfo?.area || 'N/A'}</p>
                                {/* Add Phone if available */}
                                {/* <p><strong className="text-gray-400 font-medium w-20 inline-block">Phone:</strong> {order?.shippingInfo?.phone || 'N/A'}</p> */}
                            </div>
                        </div>

                         {/* Payment & Price Panel */}
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                <MdPayment className="text-emerald-400" /> Payment Details
                            </h3>
                             <div className="space-y-3 text-sm">
                                 <div className="flex justify-between items-center">
                                     <span className="text-gray-400 font-medium">Payment Status:</span>
                                     <OrderStatusBadge status={order?.payment_status} type="payment" />
                                 </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                                     <span className="text-gray-400 font-medium">Total Price:</span>
                                     <span className="text-lg font-semibold text-emerald-300">{order?.price?.toLocaleString() || '0.00'} DA</span>
                                </div>
                             </div>
                        </div>

                        {/* Main Order Products Panel */}
                         <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                               <MdShoppingBag className="text-indigo-400"/> Ordered Products ({order?.products?.length || 0})
                            </h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                                {order?.products?.length > 0 ? (
                                    order.products.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <img
                                                className="w-14 h-14 rounded-md object-cover border border-gray-600 flex-shrink-0"
                                                src={p.images?.[0]} // Safely access first image
                                                alt={p.name}
                                                onError={(e) => e.target.src = '/path/to/default/image.png'} // Fallback image
                                            />
                                            <div className="flex-grow">
                                                <h4 className="font-medium text-gray-200 line-clamp-1">{p.name}</h4>
                                                <p className="text-xs text-gray-400">Brand: {p.brand || 'N/A'}</p>
                                                <p className="text-xs text-gray-400">Quantity: <span className="font-semibold text-gray-300">{p.quantity}</span></p>
                                                {/* Optionally add price per item if available */}
                                                {/* <p className="text-xs text-gray-400">Price: <span className="font-semibold text-gray-300">${p.price?.toLocaleString()}</span></p> */}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm text-center py-4">No products found in this order.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Seller Suborders */}
                    <div className="w-full lg:w-8/12 xl:w-2/3">
                         <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg h-full">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-5 flex items-center gap-2">
                                <MdStorefront className="text-purple-400" /> Seller Orders ({order?.suborder?.length || 0})
                            </h3>
                             {/* Suborder List */}
                            <div className="space-y-6">
                                {order?.suborder?.length > 0 ? (
                                    order.suborder.map((so, i) => (
                                        <div key={so._id || i} className="p-4 rounded-lg border border-gray-600/70 bg-[#303650]/40">
                                            {/* Suborder Header */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-600/50">
                                                 <div>
                                                    <h4 className="text-base font-semibold text-gray-200">
                                                        Seller Order #{i + 1}
                                                        {/* Optionally link to seller details if possible */}
                                                        {/* <span className="text-xs font-normal text-gray-400 ml-2">(Seller ID: {so.sellerId?.slice(-6)})</span> */}
                                                    </h4>
                                                     <p className="text-xs text-gray-400 font-mono mt-1">ID: #{so._id?.slice(-8).toUpperCase()}</p>
                                                 </div>
                                                <div className="mt-2 sm:mt-0">
                                                    <OrderStatusBadge status={so.delivery_status} type="delivery" />
                                                </div>
                                            </div>
                                            {/* Suborder Products */}
                                            <div className="space-y-3">
                                                {so.products?.length > 0 ? (
                                                    so.products.map((p, j) => (
                                                         <div key={p._id || j} className="flex items-center gap-3 text-sm">
                                                            <img
                                                                className="w-12 h-12 rounded object-cover border border-gray-600 flex-shrink-0"
                                                                src={p.images?.[0]}
                                                                alt={p.name}
                                                                onError={(e) => e.target.src = '/path/to/default/image.png'}
                                                            />
                                                            <div className="flex-grow">
                                                                <h5 className="font-medium text-gray-200 line-clamp-1">{p.name}</h5>
                                                                <p className="text-xs text-gray-400">Brand: {p.brand || 'N/A'}</p>
                                                                <p className="text-xs text-gray-400">Quantity: <span className="font-semibold text-gray-300">{p.quantity}</span></p>
                                                                {/* Optionally add Suborder Price per item */}
                                                                {/* <p className="text-xs text-gray-400">Price: <span className="font-semibold text-gray-300">${p.price?.toLocaleString()}</span></p> */}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-xs text-center py-2">No products found in this sub-order.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm text-center py-6">No seller sub-orders found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                .wave-bg { /* Keep or adjust wave animation */
                    background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e);
                    background-size: 400%;
                    animation: waveAnimation 20s ease-in-out infinite;
                }
                @keyframes waveAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                /* Custom Scrollbar for product list */
                .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #4b5563 #303650; }
                .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #303650; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
                 /* Line clamp utility */
                 .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
            `}</style>
        </div>
    );
};

export default OrderDetails;