import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { get_seller_order, messageClear, seller_order_status_update } from '../../store/Reducers/OrderReducer';
import {
    // Importing icons primarily from 'fa' (Font Awesome 5/general) for compatibility
    FaBox, FaCheckCircle, FaClipboardList, FaCog, FaShippingFast, FaTimesCircle, FaSpinner, FaArrowLeft,
    FaInfoCircle, FaMapMarkerAlt, FaHashtag, FaCalendarAlt, FaMoneyBillWave, FaPhoneAlt, FaEnvelope, FaUser, FaShoppingBag // Added FaShoppingBag
} from 'react-icons/fa';
import { FaChevronDown } from 'react-icons/fa6'; // Keep Chevron from fa6
import moment from 'moment';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// Placeholder image for products
const defaultProductImage = '/images/product_placeholder.png'; // ADJUST PATH AS NEEDED

// --- Helper: Status Badge ---
const OrderStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-flex items-center gap-1.5 border whitespace-nowrap';
    let colors = '';
    let Icon = FaInfoCircle;
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    if (type === 'payment') {
        Icon = status?.toLowerCase() === 'paid' ? FaCheckCircle : FaTimesCircle;
        colors = status?.toLowerCase() === 'paid' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    } else { // delivery status
        switch (status?.toLowerCase()) {
            case 'pending': case 'placed': colors = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; Icon = FaClipboardList; break;
            case 'processing': colors = 'bg-sky-500/10 text-sky-300 border-sky-500/30'; Icon = FaCog; break;
            case 'warehouse': colors = 'bg-blue-500/10 text-blue-300 border-blue-500/30'; Icon = FaBox; break;
            case 'shipped': colors = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'; Icon = FaShippingFast; break;
            case 'delivered': colors = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'; Icon = FaCheckCircle; break;
            case 'cancelled': colors = 'bg-rose-500/10 text-rose-300 border-rose-500/30'; Icon = FaTimesCircle; break;
            default: colors = 'bg-gray-500/10 text-gray-400 border-gray-500/30'; Icon = FaInfoCircle; break;
        }
    }
    return (
        <span className={`${baseStyle} ${colors}`}>
            {Icon && <Icon size={12} className={`${status?.toLowerCase() === 'processing' ? 'animate-spin-slow' : ''}`}/>}
            <span className="ml-1">{statusText}</span>
        </span>
    );
};

// --- Helper: Info Row ---
const InfoDisplayRow = ({ label, value, children, icon }) => (
    <div className="flex justify-between items-center py-1.5 text-sm border-b border-gray-700/30 last:border-b-0">
        <span className='text-gray-400 font-medium flex items-center gap-2'>
             {icon && React.createElement(icon, { className: "w-4 h-4"})}
             {label}:
        </span>
        <span className='text-gray-100 text-right font-medium pl-2'>
            {children || value || <span className="italic text-gray-500">N/A</span>}
        </span>
    </div>
);


const OrderDetails = () => {
    const { orderId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { order, errorMessage, successMessage, loader: orderLoader } = useSelector(state => state.order);
    const [status, setStatus] = useState('');

    useEffect(() => { if (order) { setStatus(order.delivery_status || ''); } }, [order]);

    useEffect(() => {
        if (orderId) { dispatch(get_seller_order(orderId)); }
        return () => { dispatch(messageClear()); };
    }, [orderId, dispatch]);

    const handleMessages = useCallback(() => {
         if (successMessage) { toast.success(successMessage, { style: { /* themed styles */ }}); dispatch(messageClear()); }
         if (errorMessage) { toast.error(errorMessage, { style: { /* themed styles */ }}); if(errorMessage.toLowerCase().includes('update')) { setStatus(order?.delivery_status || ''); } dispatch(messageClear()); }
     }, [successMessage, errorMessage, dispatch, order?.delivery_status]);

     useEffect(() => { handleMessages(); }, [handleMessages]);

    const handleStatusUpdate = (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        dispatch(seller_order_status_update({ orderId, info: { status: newStatus } }));
    };

    const formatPrice = (price) => (price || 0).toLocaleString('fr-DZ', {style:'currency', currency: 'DZD', minimumFractionDigits: 0});
    const formatCreatedAt = (dateString) => dateString ? moment(dateString).format('DD MMM YYYY, hh:mm A') : 'N/A';
    const handleImageError = (e) => { e.target.onerror = null; e.target.src = defaultProductImage; };
    const canUpdateStatus = !['delivered', 'cancelled'].includes(order?.delivery_status?.toLowerCase());

    // --- Fixed Address ---
    const fixedShippingAddress = "SOUG EL FALAH Sorting & Distribution Center";

    // --- RENDER STATES ---
    if (orderLoader && !order) {
         return ( <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center'> <BeatLoader color="#a855f7" size={15} /> </div> );
     }
    if (!orderLoader && !order && orderId) {
        return ( <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex flex-col justify-center items-center text-center'> <h2 className="text-xl text-red-400 mb-4">{errorMessage || "Order Not Found"}</h2> <p className="text-gray-400 mb-6">Could not load details.</p> <button onClick={() => navigate(-1)} className='bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2'> <FaArrowLeft size={14}/> Go Back </button> </div> );
     }
     if (!order) return null;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto">
                 <div className="mb-6">
                      <button onClick={() => navigate(-1)} className='text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors group'>
                         <FaArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform"/> Back to Orders
                     </button>
                 </div>

                 <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-xl'>
                    {/* Header */}
                     <div className='flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-700/50 mb-6'>
                        <div>
                            <h2 className='text-xl md:text-2xl font-bold text-gray-100 tracking-tight mb-1'>Order Details</h2>
                             <div className='flex items-center flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm'>
                                <span className="text-cyan-400 font-medium font-mono flex items-center gap-1"><FaHashtag size={10}/>{order._id?.toUpperCase() || 'N/A'}</span>
                                <span className="text-gray-600 hidden sm:inline">|</span>
                                <span className="text-gray-500 flex items-center gap-1"><FaCalendarAlt size={10}/>{formatCreatedAt(order.createdAt)}</span>
                             </div>
                        </div>
                        <div className='w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0'>
                             {canUpdateStatus ? (
                                 <div className="relative min-w-[180px]">
                                     <label htmlFor="order_status" className="text-xs text-gray-400 mb-1 block font-medium">Update Delivery Status:</label>
                                     <select onChange={handleStatusUpdate} value={status} name="order_status" id="order_status" className='appearance-none w-full cursor-pointer pl-4 pr-10 py-2 border border-gray-600/80 rounded-lg bg-[#303650]/80 text-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all duration-300 text-sm font-medium' disabled={orderLoader} >
                                         <option value="pending" disabled={order.delivery_status !== 'pending'}>Pending</option>
                                         <option value="processing" disabled={!['pending'].includes(order.delivery_status?.toLowerCase())}>Processing</option>
                                         <option value="shipped" disabled={!['processing', 'warehouse'].includes(order.delivery_status?.toLowerCase())}>Shipped</option>
                                         <option value="delivered" disabled={order.delivery_status !== 'shipped'}>Delivered</option>
                                         <option value="cancelled" disabled={['delivered', 'cancelled'].includes(order.delivery_status?.toLowerCase())}>Cancel Order</option>
                                     </select>
                                      <FaChevronDown className="absolute right-3 bottom-[11px] text-gray-400 pointer-events-none" size={14} />
                                 </div>
                              ) : (
                                 <div className="pt-1 text-right sm:text-left">
                                     <span className="text-xs text-gray-400 block mb-1 font-medium">Current Status</span>
                                     <OrderStatusBadge status={order.delivery_status} type="delivery"/>
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Details Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8 mb-8'>
                         {/* Left Section (Wider) */}
                         <div className="md:col-span-3 space-y-6">
                             <div className="bg-[#1e2337]/60 p-5 rounded-lg border border-gray-700/50">
                                <h3 className='text-base font-semibold text-gray-200 mb-3 border-b border-gray-700/50 pb-2'>Order Summary</h3>
                                <div className='space-y-2'>
                                     <InfoDisplayRow label="Payment Status"> <OrderStatusBadge status={order.payment_status} type="payment"/> </InfoDisplayRow>
                                     <InfoDisplayRow label="Delivery Status"> <OrderStatusBadge status={order.delivery_status} type="delivery"/> </InfoDisplayRow>
                                     <InfoDisplayRow label="Items"> <span className='text-gray-100 font-medium'>{order.quantity || order.products?.length || 'N/A'}</span> </InfoDisplayRow>
                                     <InfoDisplayRow label="Total Price"> <span className='text-lg font-semibold text-emerald-300'>{formatPrice(order.price)}</span> </InfoDisplayRow>
                                </div>
                             </div>
                             {/* Shipping Card - FIXED ADDRESS */}
                             <div className="bg-[#1e2337]/60 p-5 rounded-lg border border-gray-700/50">
                                <h3 className='text-base font-semibold text-gray-200 mb-3 flex items-center gap-2'> <FaMapMarkerAlt className="text-amber-400"/> Shipping Destination</h3>
                                <p className='text-sm text-gray-300 leading-relaxed font-medium'>
                                     {fixedShippingAddress}
                                 </p>
                            </div>
                            {/* END Shipping Card */}
                        </div>

                         {/* Right Section (Narrower): Products List */}
                        <div className="md:col-span-2">
                             <div className="bg-[#1e2337]/60 p-5 rounded-lg border border-gray-700/50 h-full flex flex-col">
                                <h3 className='text-base font-semibold text-gray-200 mb-4 pb-2 border-b border-gray-700/50 flex-shrink-0'>Products ({order?.products?.length || 0})</h3>
                                <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 max-h-[400px] lg:max-h-none">
                                    {order?.products && order.products.length > 0 ? (
                                        order.products.map((p, i) => (
                                            <div key={p._id || i} className='flex gap-3 items-center p-3 bg-[#303650]/40 rounded-lg border border-gray-600/40'>
                                                <Link to={`/product/details/${p.slug}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 block hover:opacity-80 transition-opacity">
                                                    <img className='w-16 h-16 rounded object-cover border border-gray-600' src={p.images && p.images[0] ? p.images[0] : defaultProductImage} alt={p.name || 'Product'} onError={handleImageError}/>
                                                </Link>
                                                <div className="flex-grow overflow-hidden">
                                                    <Link to={`/product/details/${p.slug}`} target="_blank" rel="noopener noreferrer" className='text-sm font-medium text-gray-100 hover:text-cyan-400 transition-colors mb-0.5 block truncate' title={p.name}> {p.name || 'Product Name'} </Link>
                                                     <p className='text-xs text-gray-400'> Qty: <span className="font-medium text-gray-200">{p.quantity}</span> </p>
                                                     <p className="text-xs text-emerald-400 font-medium"> {formatPrice(p.price)} </p>
                                                 </div>
                                            </div>
                                        ))
                                     ) : ( <p className="text-sm text-gray-500 italic text-center py-6">No products found.</p> )}
                                </div>
                            </div>
                        </div>
                    </div>

                 </div>
            </div>

            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 35, 55, 0.4); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.7); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.9); }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(75, 85, 99, 0.7) rgba(30, 35, 55, 0.4); }
                 /* Slow spin animation */
                 @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                 .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                 /* Select dropdown styling */
                 select option { background-color: #252A40; color: #e5e7eb; }
                 /* Table Alignment */
                  td, th { vertical-align: middle; }
            `}</style>
        </div>
    );
};

export default OrderDetails;