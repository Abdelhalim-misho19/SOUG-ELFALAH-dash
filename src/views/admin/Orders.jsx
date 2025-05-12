import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; // Assuming this component is styled appropriately
import { useDispatch, useSelector } from 'react-redux';
import { get_admin_orders } from '../../store/Reducers/OrderReducer';
import Search from '../components/Search'; // Assuming this component allows styling or fits theme
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Icons for expand/collapse
// Import the badge component if created separately
// import OrderStatusBadge from '../components/OrderStatusBadge';

// --- If NOT importing OrderStatusBadge, define it here ---
const OrderStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
    if (type === 'payment') {
        colors = status?.toLowerCase() === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else {
        switch (status?.toLowerCase()) {
            case 'delivered': colors = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'; break;
            case 'cancelled': colors = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'; break;
            case 'processing': colors = 'bg-sky-500/20 text-sky-300 border border-sky-500/30'; break;
            case 'shipped': colors = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'; break;
            case 'pending': default: colors = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; break;
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};
// --- End of inline OrderStatusBadge definition ---


const Orders = () => {
    const dispatch = useDispatch();
    const { myOrders = [], totalOrder = 0 } = useSelector((state) => state.order); // Default to empty array/0

    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(5);
    const [expandedOrderId, setExpandedOrderId] = useState(null); // Use a more descriptive name

    useEffect(() => {
        const obj = {
            parPage: parseInt(parPage),
            page: parseInt(currentPage),
            searchValue,
        };
        dispatch(get_admin_orders(obj));
    }, [searchValue, currentPage, parPage, dispatch]);

    const toggleSuborder = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    // Basic Loading state check (can be enhanced with a dedicated loading flag from Redux)
    const isLoading = !myOrders; // Simple check, assumes null/undefined means loading

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative">
            {/* Subtle Background Effects (Optional) */}
            {/* <div className="absolute inset-0 particles pointer-events-none opacity-50" /> */}
             <div className="absolute inset-0 wave-bg opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/30 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-full mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight mb-8">
                    Manage Orders
                </h1>

                <div className="w-full rounded-xl p-5 sm:p-6 bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                    {/* Search and Filter Section */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        {/* Pass theme-related classes if Search component accepts them */}
                        <Search
                            setParPage={setParPage} // Consider moving parPage select near Search if related
                            setSearchValue={setSearchValue}
                            searchValue={searchValue}
                            // Example: Pass styling props if supported by Search component
                            // inputClass="!bg-[#303650]/60 !border-gray-600 focus:!border-cyan-500"
                            // buttonClass="!bg-cyan-600 hover:!bg-cyan-700"
                        />
                        <div className="flex items-center gap-3">
                            <label htmlFor="parPageSelect" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select
                                id="parPageSelect"
                                onChange={(e) => setParPage(parseInt(e.target.value))}
                                value={parPage}
                                className="px-3 py-1.5 w-20 rounded-md bg-[#374151]/50 border border-gray-600 text-gray-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders Table Container */}
                    <div className="relative overflow-x-auto rounded-lg border border-gray-700/50">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs uppercase text-gray-400 bg-[#303650]/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    {/* Adjust padding and widths as needed */}
                                    <th scope="col" className="py-3 px-4 sm:px-6 min-w-[150px]">Order ID</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 min-w-[100px]">Price</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 min-w-[140px]">Payment Status</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 min-w-[140px]">Order Status</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 min-w-[100px] text-center">Action</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {isLoading ? (
                                    // Basic Loading Indicator (replace with skeletons if preferred)
                                     <tr><td colSpan="6" className="py-8 px-4 sm:px-6 text-center text-gray-500">Loading orders...</td></tr>
                                ) : myOrders.length > 0 ? (
                                    myOrders.map((o, i) => (
                                        <React.Fragment key={o._id}>
                                            <tr className="hover:bg-[#303650]/40 transition-colors">
                                                <td className="py-4 px-4 sm:px-6 font-mono text-gray-200">#{o._id.slice(-8).toUpperCase()}</td> {/* Shorter ID, monospace */}
                                                <td className="py-4 px-4 sm:px-6">{o.price?.toLocaleString() ?? '0.00'} DA</td>
                                                <td className="py-4 px-4 sm:px-6"><OrderStatusBadge status={o.payment_status} type="payment" /></td>
                                                <td className="py-4 px-4 sm:px-6"><OrderStatusBadge status={o.delivery_status} type="delivery" /></td>
                                                <td className="py-4 px-4 sm:px-6 text-center">
                                                    <Link
                                                        to={`/admin/dashboard/order/details/${o._id}`}
                                                        className="font-medium text-cyan-400 hover:text-cyan-200 transition-colors"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6 text-center">
                                                    <button
                                                        onClick={() => toggleSuborder(o._id)}
                                                        className="text-gray-400 hover:text-cyan-400 transition-all duration-300 p-1 rounded-full hover:bg-gray-600/50"
                                                        aria-expanded={expandedOrderId === o._id}
                                                        aria-controls={`suborders-${o._id}`}
                                                    >
                                                        {expandedOrderId === o._id ? (
                                                            <FaChevronUp size={14} />
                                                        ) : (
                                                            <FaChevronDown size={14} />
                                                        )}
                                                        <span className="sr-only">Toggle suborder details</span>
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Suborder Details (Expandable) */}
                                            {expandedOrderId === o._id && (
                                                <tr id={`suborders-${o._id}`} className="bg-[#1e2337]/60"> {/* Slightly different bg */}
                                                    <td colSpan="6" className="p-0">
                                                        {/* Add padding and border to the inner content */}
                                                        <div className="p-4 border-l-4 border-cyan-600/50">
                                                            <h4 className="text-sm font-semibold text-gray-300 mb-3 ml-2">Sub-Orders</h4>
                                                            {o.suborder?.length > 0 ? (
                                                                <div className="relative overflow-x-auto rounded border border-gray-600/50">
                                                                    <table className="w-full text-xs text-left text-gray-300">
                                                                        <thead className="text-xs uppercase text-gray-400 bg-[#303650]/70">
                                                                            <tr>
                                                                                <th scope="col" className="py-2 px-4">Sub ID</th>
                                                                                <th scope="col" className="py-2 px-4">Price</th>
                                                                                <th scope="col" className="py-2 px-4">Payment</th>
                                                                                <th scope="col" className="py-2 px-4">Status</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-600/50">
                                                                            {o.suborder.map((so) => (
                                                                                <tr key={so._id} className="hover:bg-[#303650]/60 transition-colors">
                                                                                    <td className="py-2 px-4 font-mono text-gray-300">#{so._id.slice(-6).toUpperCase()}</td>
                                                                                    <td className="py-2 px-4">{so.price?.toLocaleString() ?? '0.00'} DA</td>
                                                                                    <td className="py-2 px-4"><OrderStatusBadge status={so.payment_status} type="payment" /></td>
                                                                                    <td className="py-2 px-4"><OrderStatusBadge status={so.delivery_status} type="delivery" /></td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 text-gray-500 text-sm text-center">
                                                                    No sub-orders associated with this order.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    // No Orders Found Row
                                    <tr>
                                        <td colSpan="6" className="py-8 px-4 sm:px-6 text-center text-gray-500 text-sm">
                                            No orders found{searchValue ? ` matching "${searchValue}"` : ''}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalOrder > parPage && (
                        <div className="w-full flex justify-center sm:justify-end mt-6">
                             {/* Ensure Pagination component is styled */}
                            <Pagination
                                pageNumber={currentPage}
                                setPageNumber={setCurrentPage}
                                totalItem={totalOrder}
                                parPage={parPage}
                                showItem={3} // Show fewer items on smaller screens potentially
                                // Pass theme classes if Pagination supports it
                                // theme="dark"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS (Keep or adjust wave animation) */}
            <style jsx>{`
                .wave-bg {
                    background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e);
                    background-size: 400%;
                    animation: waveAnimation 20s ease-in-out infinite;
                }
                @keyframes waveAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                 /* Optional: Add custom scrollbar styles if needed */
                 .scrollbar-thin { /* Apply this class to scrollable divs if needed */
                    scrollbar-width: thin;
                    scrollbar-color: #4b5563 #303650;
                 }
                .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #303650; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
            `}</style>
        </div>
    );
};

export default Orders;