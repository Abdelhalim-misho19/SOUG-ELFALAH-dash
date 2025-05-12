import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdCurrencyExchange, MdProductionQuantityLimits, MdPendingActions, MdOutlineBarChart, MdChat, MdReceiptLong } from 'react-icons/md';
import { FaUsers, FaShoppingCart, FaUserClock } from 'react-icons/fa';
import Chart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import sellerIcon from '../../assets/seller.png';
import adminIcon from '../../assets/admins.jpg';
import { get_admin_dashboard_data, clearError } from '../../store/Reducers/dashboardReducer';
import moment from 'moment';
import { BeatLoader } from 'react-spinners';

// Enhanced Skeleton Loader Component
const SkeletonLoader = ({ className = "", type = "block" }) => {
    if (type === "text") return <div className={`animate-pulse bg-gray-700/60 rounded h-4 ${className}`} />;
    if (type === "title") return <div className={`animate-pulse bg-gray-700/60 rounded h-6 ${className}`} />;
    if (type === "avatar") return <div className={`animate-pulse bg-gray-700/60 rounded-full ${className}`} />;
    return <div className={`animate-pulse bg-gray-700/60 rounded ${className}`} />;
};

// Status Badge Component for Orders Table
const OrderStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap';
    let colors = '';
    if (type === 'payment') {
        colors = status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else {
        switch (status) {
            case 'delivered': colors = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'; break;
            case 'cancelled': colors = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'; break;
            case 'processing': colors = 'bg-sky-500/20 text-sky-300 border border-sky-500/30'; break;
            case 'shipped': colors = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'; break;
            case 'pending': default: colors = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; break;
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}</span>;
};

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        totalSale, totalOrder, totalProduct, totalSeller,
        totalPendingOrder, totalPendingSellerRequests, recentOrders,
        recentMessages, /* recentSellerRequests removed */ chartData, loading, error, // <- FIX: Removed recentSellerRequests
    } = useSelector((state) => state.dashboard);
    const { userInfo } = useSelector((state) => state.auth);
    const [timePeriod, setTimePeriod] = useState('year');

    useEffect(() => {
        dispatch(get_admin_dashboard_data({ period: timePeriod }));
    }, [dispatch, timePeriod]);

    const chartConfig = useMemo(() => {
        // ... (chartConfig logic remains the same)
        let categories = [];
        let dataLength = 0;

        if (timePeriod === 'year') { categories = moment.monthsShort(); dataLength = 12; }
        else if (timePeriod === 'month') { const days = moment().daysInMonth(); categories = Array.from({ length: days }, (_, i) => (i + 1).toString()); dataLength = days; }
        else { categories = moment.weekdaysShort(); dataLength = 7; } // week

        const safeChartData = chartData || {};
        const sales = safeChartData.sales?.length === dataLength ? safeChartData.sales : Array(dataLength).fill(0);
        const orders = safeChartData.orders?.length === dataLength ? safeChartData.orders : Array(dataLength).fill(0);
        const sellers = safeChartData.sellers?.length === dataLength ? safeChartData.sellers : Array(dataLength).fill(0);

        return {
            series: [
                { name: 'Orders', data: orders },
                { name: 'Revenue (DA)', data: sales },
                { name: 'New Sellers', data: sellers },
            ],
            options: {
                colors: ['#2dd4bf', '#a855f7', '#34d399'], // Teal, Purple, Emerald
                chart: { type: 'bar', height: 350, background: 'transparent', foreColor: '#cbd5e1', // Lighter Gray
                    toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
                },
                plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 5 } },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ['transparent'] },
                xaxis: { categories: categories, labels: { style: { fontSize: '11px', colors: '#94a3b8' } }, // Slightly smaller, muted color
                         axisBorder: { color: '#4b5563' }, axisTicks: { color: '#4b5563' }, }, // Gray border/ticks
                yaxis: {
                    title: { text: 'Count / Amount (DA)', style: { fontSize: '13px', fontWeight: 500, color: '#cbd5e1' } },
                    labels: { style: { fontSize: '11px', colors: '#94a3b8' }, formatter: (val) => val !== undefined ? val.toFixed(0) : '0' },
                    axisBorder: { show: false }, // Hide y-axis line for cleaner look
                },
                grid: { borderColor: '#374151', strokeDashArray: 4 }, // Darker grid lines
                legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px', fontWeight: 500, labels: { colors: '#cbd5e1' }, markers: { radius: 5, width: 10, height: 10 } },
                tooltip: {
                    theme: 'dark', style: { fontSize: '12px' },
                    y: { formatter: (v, { seriesIndex }) => seriesIndex === 1 ? `${v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} DA` : v?.toFixed(0) || '0' } // Adjusted formatter
                },
                responsive: [{ breakpoint: 640, options: { chart: { height: 300 }, plotOptions: { bar: { columnWidth: '70%' } }, xaxis: { labels: { rotate: -45, style: { fontSize: '10px' } } } } }],
            },
        };
    }, [chartData, timePeriod]);

    // --- RENDER COMPONENT ---
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-full mx-auto">
                {/* Dashboard Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">Admin Dashboard</h1>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg flex justify-between items-center shadow-lg animate-slideIn">
                        <span>Error: {typeof error === 'string' ? error : 'An unexpected error occurred.'}</span>
                        <button onClick={() => dispatch(clearError())} className="ml-4 px-3 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors">Dismiss</button>
                    </div>
                )}

                {/* Statistics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-6">
                     {[ // Array defining the stats cards
                        { title: 'Total Revenue', value: totalSale, format: 'currency', icon: <MdCurrencyExchange size={24} />, link: null, color: 'emerald' },
                        { title: 'Total Orders', value: totalOrder, icon: <FaShoppingCart size={22} />, link: '/admin/dashboard/orders', color: 'sky' },
                        { title: 'Pending Orders', value: totalPendingOrder, icon: <MdPendingActions size={24} />, link: '/admin/dashboard/orders', color: 'amber' },
                        { title: 'Total Products', value: totalProduct, icon: <MdProductionQuantityLimits size={24} />, link: null, color: 'indigo' },
                        { title: 'Active Sellers', value: totalSeller, icon: <FaUsers size={22} />, link: '/admin/dashboard/sellers', color: 'teal' },
                        { title: 'Seller Requests', value: totalPendingSellerRequests, icon: <FaUserClock size={22} />, link: '/admin/dashboard/sellers-request', color: 'rose' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`relative overflow-hidden p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg group animate-slideIn transition-all duration-300 ${stat.link ? 'cursor-pointer hover:border-cyan-500/60 hover:bg-[#2A2F47]/80' : 'cursor-default'}`}
                             style={{ animationDelay: `${i * 50}ms` }}
                             onClick={() => stat.link && navigate(stat.link)}
                        >
                            {/* ... card content ... */}
                            <div className={`absolute top-0 left-0 h-1 w-16 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-br-lg group-hover:w-full transition-all duration-400`} />
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col space-y-1">
                                    <span className="text-sm font-medium text-gray-400">{stat.title}</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-gray-100">
                                        {loading ? (
                                            <SkeletonLoader className="w-24 h-8 mt-1" type="text" />
                                        ) : stat.format === 'currency' ? (
                                            `${(stat.value || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} DA`
                                        ) : (
                                            (stat.value || 0).toLocaleString()
                                        )}
                                    </span>
                                </div>
                                <div className={`flex justify-center items-center w-12 h-12 rounded-full bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/30 text-${stat.color}-400 border border-${stat.color}-500/30 shadow-md group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-${stat.color}-500/20 transition-all duration-300`}>
                                    {stat.icon}
                                </div>
                            </div>
                             {(stat.title === 'Seller Requests' || stat.title === 'Pending Orders') && !loading && stat.value > 0 && ( // Combined condition
                                 <div className="absolute top-3 right-3">
                                    <span className="relative flex h-3 w-3">
                                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${stat.color}-400 opacity-75`}></span>
                                      <span className={`relative inline-flex rounded-full h-3 w-3 bg-${stat.color}-500 border-2 border-[#252A40]`}></span>
                                    </span>
                                 </div>
                             )}
                        </div>
                    ))}
                </div>

                {/* Main Content Row: Chart and Messages */}
                <div className="flex flex-col lg:flex-row mt-8 gap-5 sm:gap-6">

                    {/* Overview Chart Panel */}
                    <div className="w-full lg:w-[60%] xl:w-[65%]">
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg h-full animate-slideIn" style={{ animationDelay: '200ms' }}>
                            {/* ... chart panel content ... */}
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2 sm:mb-0 flex items-center gap-2">
                                   <MdOutlineBarChart className="text-cyan-400" /> Overview
                                </h2>
                                <select
                                    value={timePeriod}
                                    onChange={(e) => setTimePeriod(e.target.value)}
                                    className="px-3 py-1.5 bg-[#374151]/50 border border-gray-600 rounded-md text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                                    aria-label="Select time period for chart"
                                >
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <div className="min-h-[360px]">
                                {loading && !chartData ? (
                                    <div className="h-[360px] flex justify-center items-center"><SkeletonLoader className="h-full w-full" /></div>
                                ) : chartData && chartData.sales?.length > 0 ? ( // Check if sales data exists before rendering
                                    <Chart options={chartConfig.options} series={chartConfig.series} type="bar" height={350} />
                                ) : (
                                    <div className="text-center text-gray-500 py-10 h-[360px] flex items-center justify-center">
                                        {loading ? <BeatLoader color="#34d399" size={10} /> : 'No chart data available.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     {/* Recent Messages Panel */}
                     <div className="w-full lg:w-[40%] xl:w-[35%]">
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg h-full flex flex-col animate-slideIn" style={{ animationDelay: '250ms', maxHeight: '470px' }}>
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2">
                                    <MdChat className="text-purple-400"/> Recent Messages
                                </h2>
                                <Link to="/admin/dashboard/chat-sellers" className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium">View All</Link>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin">
                                <ol className="space-y-5">
                                    {loading && !recentMessages?.length ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <li key={i} className="flex items-start space-x-3"> <SkeletonLoader type="avatar" className="w-9 h-9 flex-shrink-0 mt-1" /> <div className="flex-grow space-y-2"> <SkeletonLoader type="text" className="w-3/4"/> <SkeletonLoader type="text" className="w-full h-10"/> </div> </li>
                                        ))
                                    ) : recentMessages?.length > 0 ? (
                                        // --- FIX: Add index 'i' to map function ---
                                        recentMessages.map((m, i) => {
                                            const senderIsAdmin = m.senderId === '' || m.senderId === 'admin';
                                            const sellerChatId = senderIsAdmin ? m.receverId : m.senderId;
                                            return (
                                                // --- FIX: Use the index 'i' here ---
                                                <li key={m._id} className="flex items-start space-x-3 animate-slideIn group" style={{ animationDelay: `${i * 70}ms` }}>
                                                    <img className="w-9 h-9 rounded-full object-cover border-2 border-gray-600 flex-shrink-0 mt-1 shadow-sm" src={senderIsAdmin ? (userInfo?.image || adminIcon) : sellerIcon} alt={senderIsAdmin ? "Admin" : "Seller"} />
                                                    <div className="flex-grow bg-[#303650]/50 p-3 rounded-lg border border-gray-600/70 shadow-sm group-hover:border-purple-500/50 transition-colors">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <Link to={sellerChatId ? `/admin/dashboard/chat-sellers/${sellerChatId}` : '/admin/dashboard/chat-sellers'} className="text-sm font-semibold text-gray-200 hover:text-purple-300 transition-colors">
                                                                {m.senderName || (senderIsAdmin ? 'Admin' : 'Unknown Seller')}
                                                            </Link>
                                                            <time className="text-xs text-gray-500">{m.createdAt ? moment(m.createdAt).fromNow(true) : ''}</time>
                                                        </div>
                                                        <p className="text-sm text-gray-300 line-clamp-2">
                                                            {m.message || 'No content'}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-center text-sm text-gray-500 py-10">No recent messages found.</li>
                                    )}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table Section */}
                <div className="w-full mt-8">
                    <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg animate-slideIn" style={{ animationDelay: '300ms' }}>
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2 sm:mb-0 flex items-center gap-2">
                               <MdReceiptLong className="text-emerald-400"/> Recent Orders
                            </h2>
                            <Link to="/admin/dashboard/orders" className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium">View All Orders</Link>
                        </div>
                        <div className="relative overflow-x-auto rounded-lg border border-gray-700/50">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs uppercase text-gray-400 bg-[#303650]/50">
                                    <tr>
                                        <th scope="col" className="py-3 px-4 sm:px-6">Order ID</th>
                                        <th scope="col" className="py-3 px-4 sm:px-6">Price</th>
                                        <th scope="col" className="py-3 px-4 sm:px-6">Payment</th>
                                        <th scope="col" className="py-3 px-4 sm:px-6">Status</th>
                                        <th scope="col" className="py-3 px-4 sm:px-6">Date</th>
                                        <th scope="col" className="py-3 px-4 sm:px-6 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && !recentOrders?.length ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="border-b border-gray-700/50">
                                                <td className="py-4 px-4 sm:px-6"><SkeletonLoader type="text" className="w-16"/></td>
                                                <td className="py-4 px-4 sm:px-6"><SkeletonLoader type="text" className="w-12"/></td>
                                                <td className="py-4 px-4 sm:px-6"><SkeletonLoader type="text" className="w-10 h-5"/></td>
                                                <td className="py-4 px-4 sm:px-6"><SkeletonLoader type="text" className="w-16 h-5"/></td>
                                                <td className="py-4 px-4 sm:px-6"><SkeletonLoader type="text" className="w-20"/></td>
                                                <td className="py-4 px-4 sm:px-6 text-center"><SkeletonLoader type="text" className="w-8 h-5 mx-auto"/></td>
                                            </tr>
                                        ))
                                    ) : recentOrders?.length > 0 ? (
                                        recentOrders.map((d, i) => (
                                            <tr key={d._id} className="border-b border-gray-700/50 hover:bg-[#303650]/40 transition-colors animate-slideIn" style={{ animationDelay: `${i * 60}ms` }}>
                                                {/* --- FIX: Remove scope="row" from tds --- */}
                                                <td className="py-4 px-4 sm:px-6 font-medium text-gray-200">#{d._id?.slice(-6).toUpperCase() || 'N/A'}</td>
                                                <td className="py-4 px-4 sm:px-6">{d.price?.toLocaleString() || '0'} DA</td>
                                                <td className="py-4 px-4 sm:px-6"><OrderStatusBadge status={d.payment_status} type="payment" /></td>
                                                <td className="py-4 px-4 sm:px-6"><OrderStatusBadge status={d.delivery_status} type="delivery" /></td>
                                                <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-gray-400">{d.createdAt ? moment(d.createdAt).format("DD MMM YYYY") : 'N/A'}</td>
                                                <td className="py-4 px-4 sm:px-6 text-center">
                                                    <Link to={`/admin/dashboard/order/details/${d._id}`} className="font-medium text-cyan-400 hover:text-cyan-200 transition-colors">View</Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="py-8 px-4 sm:px-6 text-center text-gray-500">No recent orders found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Embedded CSS Styles */}
            <style jsx>{`
                /* Particles background */
                 .particles {
                    background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px),
                                      radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px);
                    background-size: 30px 30px, 50px 50px;
                    background-position: 0 0, 25px 25px;
                    animation: particleMove 30s linear infinite;
                }
                @keyframes particleMove {
                    from { background-position: 0 0, 25px 25px; }
                    to { background-position: 300px 300px, 325px 325px; }
                }
                /* Slide-in animation */
                .animate-slideIn {
                    animation: slideIn 0.5s ease-out forwards;
                    opacity: 0;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                 /* Custom Scrollbar */
                .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #4b5563 #303650; }
                .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #303650; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
                /* Line clamp utility */
                 .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;