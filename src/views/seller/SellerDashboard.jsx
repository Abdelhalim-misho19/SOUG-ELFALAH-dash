import React, { useEffect, useState, useMemo } from 'react';
import { MdCurrencyExchange, MdProductionQuantityLimits, MdOutlineBarChart, MdChat, MdReceiptLong } from 'react-icons/md'; // Relevant icons
import { FaUsers, FaShoppingCart, FaUserClock, FaExclamationTriangle, FaPercentage } from 'react-icons/fa'; // Added warning icon, FaPercentage
import Chart from 'react-apexcharts';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Correct action names based on previous discussions (assuming these exist)
import { get_seller_dashboard_data, get_seller_chart_data, clearError } from '../../store/Reducers/dashboardReducer';
import moment from 'moment';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// --- Helper: Skeleton Loader ---
const SkeletonLoader = ({ className = "", type = "block" }) => {
    if (type === "text") return <div className={`animate-pulse bg-gray-700/60 rounded h-4 ${className}`} />;
    if (type === "title") return <div className={`animate-pulse bg-gray-700/60 rounded h-6 ${className}`} />;
    if (type === "avatar") return <div className={`animate-pulse bg-gray-700/60 rounded-full ${className}`} />;
    return <div className={`animate-pulse bg-gray-700/60 rounded ${className}`} />;
};

// --- Helper: Status Badge ---
const StatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap border';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    if (type === 'payment') {
        colors = status?.toLowerCase() === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    } else { // delivery status
        switch (status?.toLowerCase()) {
            case 'delivered': colors = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; break;
            case 'cancelled': colors = 'bg-rose-500/20 text-rose-300 border-rose-500/30'; break;
            case 'processing': colors = 'bg-sky-500/20 text-sky-300 border-sky-500/30'; break;
            case 'shipped': colors = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'; break;
            case 'pending': default: colors = 'bg-amber-500/20 text-amber-300 border-amber-500/30'; break;
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};

// --- Helper: Stat Card ---
const StatCard = ({ title, value, icon, tooltip, changePercent = null, format = 'number', loading, color = 'purple' }) => {
    const formatValue = (val) => {
        if (val === null || val === undefined) return '0';
        if (format === 'currency') {
            return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`;
        }
        return val.toLocaleString();
    };

    const colorClasses = {
        purple: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', iconBg: 'bg-purple-500/50', iconText: 'text-purple-300', shadow: 'hover:shadow-purple-500/20' },
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/50', iconText: 'text-emerald-300', shadow: 'hover:shadow-emerald-500/20' },
        sky: { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30', iconBg: 'bg-sky-500/50', iconText: 'text-sky-300', shadow: 'hover:shadow-sky-500/20' },
        cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', iconBg: 'bg-cyan-500/50', iconText: 'text-cyan-300', shadow: 'hover:shadow-cyan-500/20' },
        amber: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', iconBg: 'bg-amber-500/50', iconText: 'text-amber-300', shadow: 'hover:shadow-amber-500/20' },
    };
    const styles = colorClasses[color] || colorClasses.purple; // Default to purple

    return (
        <div className={`flex justify-between items-center p-5 bg-[#252A40]/70 rounded-xl border border-gray-700/80 shadow-lg group transition-shadow duration-300 ${styles.shadow}`} data-tooltip-id="db-tip" data-tooltip-content={tooltip}>
            {loading ? (
                <div className="w-full">
                    <SkeletonLoader type="title" className="w-3/5 mb-3" />
                    <SkeletonLoader type="text" className="w-1/2" />
                </div>
            ) : (
                <>
                    <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-gray-400">{title}</span>
                        <span className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>{formatValue(value)}</span>
                        {changePercent !== null && (
                            <div className="flex items-center gap-1">
                                <span className={`text-xs font-semibold ${changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {changePercent >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:inline">(vs last month)</span>
                            </div>
                        )}
                    </div>
                    <div className={`w-11 h-11 rounded-full ${styles.iconBg} flex justify-center items-center ${styles.iconText} flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                </>
            )}
        </div>
    );
};


const SellerDashboard = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const {
        sellerTotalSale: totalSale = 0,
        sellerTotalOrder: totalOrder = 0,
        sellerTotalProduct: totalProduct = 0,
        sellerTotalPendingOrder: totalPendingOrder = 0,
        sellerRecentOrders: recentOrder = [],
        sellerRecentMessages: recentMessage = [],
        sellerSaleChange: saleChange = null,
        chartData = null,
        loading: dashboardLoading, // Combined loading state
        error: dashboardError,
    } = useSelector((state) => state.dashboard);

    const [timePeriod, setTimePeriod] = useState('month');
    const [orderFilter, setOrderFilter] = useState('all');
    const [chartError, setChartError] = useState(null);

    // --- Data Fetching Effects (Keep as is) ---
    useEffect(() => {
        if (!userInfo?._id) return;
        dispatch(clearError()); setChartError(null);
        dispatch(get_seller_dashboard_data()).unwrap().catch(err => console.error('Summary fetch failed:', err));
        dispatch(get_seller_chart_data({ sellerId: userInfo._id, period: timePeriod })).unwrap().catch(err => setChartError(err?.message || 'Unable to load chart data.'));
    }, [dispatch, userInfo?._id]);

     useEffect(() => {
        if (!userInfo?._id || !timePeriod || chartData?.period === timePeriod) return;
        setChartError(null);
        dispatch(get_seller_chart_data({ sellerId: userInfo._id, period: timePeriod })).unwrap().catch(err => setChartError(err?.message || `Unable to load chart data for ${timePeriod}.`));
     }, [dispatch, userInfo?._id, timePeriod, chartData]);


    // --- Chart Configuration (Keep as is) ---
    const chartState = useMemo(() => { /* ... same as before ... */
        let categories = []; let dataLength = 0; const currentPeriod = timePeriod;
        if (currentPeriod === 'year') { categories = moment.monthsShort(); dataLength = 12; }
        else if (currentPeriod === 'month') { const days = moment().daysInMonth(); categories = Array.from({ length: days }, (_, i) => (i + 1).toString()); dataLength = days; }
        else { categories = moment.weekdaysShort(); dataLength = 7; }
        const safeChartData = (chartData && chartData.period === currentPeriod) ? chartData : {};
        const orders = safeChartData.orders?.length === dataLength ? safeChartData.orders : Array(dataLength).fill(0);
        const revenue = safeChartData.revenue?.length === dataLength ? safeChartData.revenue : Array(dataLength).fill(0);
        return {
            series: [ { name: 'Orders', data: orders }, { name: 'Revenue (DA)', data: revenue } ],
            options: { colors: ['#2dd4bf', '#a855f7'], chart: { type: 'bar', height: 350, background: 'transparent', foreColor: '#cbd5e1', fontFamily: 'inherit', toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true } } }, plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 5 } }, dataLabels: { enabled: false }, stroke: { show: true, width: 2, colors: ['transparent'] }, xaxis: { categories: categories, labels: { style: { fontSize: '11px', colors: '#94a3b8' } }, axisBorder: { color: '#4b5563' }, axisTicks: { color: '#4b5563' }, }, yaxis: { title: { text: 'Count / Amount (DA)', style: { fontSize: '13px', fontWeight: 500, color: '#cbd5e1' } }, labels: { style: { fontSize: '11px', colors: '#94a3b8' }, formatter: (val) => val?.toFixed(0) || '0' }, axisBorder: { show: false }, }, grid: { borderColor: '#374151', strokeDashArray: 4, padding: { left: 5, right: 5 } }, fill: { opacity: 1 }, tooltip: { theme: 'dark', style: { fontSize: '12px' }, y: { formatter: (v, { seriesIndex }) => seriesIndex === 1 ? `${v?.toLocaleString() || '0'} DA` : v?.toFixed(0) || '0' } }, legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px', fontWeight: 500, labels: { colors: '#cbd5e1' }, markers: { radius: 5, width: 10, height: 10 } }, responsive: [{ breakpoint: 768, options: { plotOptions: { bar: { columnWidth: '60%' } } } }, { breakpoint: 640, options: { chart: { height: 300 }, xaxis: { labels: { rotate: -45, style: { fontSize: '10px' } } } } }], },
        };
    }, [chartData, timePeriod]);

    // --- Filtered Orders ---
    const filteredOrders = useMemo(() => {
        return (recentOrder || []).filter(
            (order) => orderFilter === 'all' || order.delivery_status === orderFilter
        );
    }, [recentOrder, orderFilter]);

    // Determine chart loading state more accurately
    const isLoadingChartData = dashboardLoading && !chartData; // Determine chart loading state


    return (
        <div className="px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">Seller Dashboard</h1>
                    <div className="flex gap-3 sm:gap-4">
                        <Link to="/seller/dashboard/profile" className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline">View Profile</Link>
                    </div>
                </div>

                {/* General Error Display */}
                {dashboardError && ( <div className="mb-6 p-4 bg-rose-900/50 border border-rose-700 text-rose-200 rounded-lg shadow-lg"> Error: {dashboardError.message || 'Failed to load dashboard data.'} </div> )}

                {/* Stats Cards - Using StatCard Component */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
                     <StatCard
                        title="Total Sales"
                        value={totalSale}
                        icon={<MdCurrencyExchange size={22} />}
                        tooltip="Total revenue from delivered orders"
                        changePercent={saleChange}
                        format="currency"
                        loading={dashboardLoading && totalSale === 0}
                        color="emerald"
                    />
                    <StatCard
                        title="Products"
                        value={totalProduct}
                        icon={<MdProductionQuantityLimits size={22} />}
                        tooltip="Number of active products"
                        loading={dashboardLoading && totalProduct === 0}
                        color="sky"
                    />
                    <StatCard
                        title="Total Orders"
                        value={totalOrder}
                        icon={<FaShoppingCart size={20} />}
                        tooltip="Total orders received (all statuses)"
                        loading={dashboardLoading && totalOrder === 0}
                        color="cyan"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={totalPendingOrder}
                        icon={<FaUserClock size={18} />}
                        tooltip="Orders awaiting processing"
                        loading={dashboardLoading && totalPendingOrder === 0}
                        color="amber"
                    />
                </div>

                {/* Chart and Messages Row */}
                <div className="w-full flex flex-col lg:flex-row mt-6 gap-6 lg:gap-8">
                    {/* Performance Chart Panel */}
                    <div className="w-full lg:w-7/12">
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg h-full flex flex-col">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2 sm:mb-0 flex items-center gap-2"> <MdOutlineBarChart className="text-purple-400" /> Performance </h2>
                                <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="px-3 py-1.5 bg-[#374151]/50 border border-gray-600 rounded-md text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer" aria-label="Select chart time period">
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <div className="flex-grow min-h-[350px]">
                                {chartError ? (
                                    <div className="p-4 h-full flex flex-col justify-center items-center bg-rose-900/30 border border-rose-700/50 text-rose-300 rounded-lg text-center">
                                         <FaExclamationTriangle className="text-3xl mb-2" /> <p className="text-sm">{chartError}</p>
                                         <button onClick={() => dispatch(get_seller_chart_data({ sellerId: userInfo._id, period: timePeriod }))} className="mt-3 px-3 py-1 text-xs bg-rose-700 hover:bg-rose-600 rounded">Retry</button>
                                    </div>
                                ) : isLoadingChartData ? (
                                    <div className="h-[350px] flex justify-center items-center"><SkeletonLoader className="h-full w-full rounded-md" /></div>
                                ) : chartData && chartData.period === timePeriod ? (
                                    <Chart options={chartState.options} series={chartState.series} type="bar" height={350} />
                                ) : (
                                     <div className="text-center text-gray-500 h-[350px] flex items-center justify-center italic">No performance data for this period.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Messages Panel */}
                    <div className="w-full lg:w-5/12">
                        <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg h-full flex flex-col max-h-[480px]"> {/* Increased max height */}
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2"> <MdChat className="text-emerald-400"/> Recent Messages </h2>
                                <Link to="/seller/dashboard/chat-customer" className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">View All</Link>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar"> {/* Use custom scrollbar */}
                                <ol className="space-y-4">
                                    {dashboardLoading && recentMessage.length === 0 ? (
                                        Array(4).fill(0).map((_, i) => ( <li key={`skel-msg-${i}`} className="flex items-start space-x-3 opacity-75"><SkeletonLoader type="avatar" className="w-9 h-9 flex-shrink-0 mt-1" /><div className="flex-grow space-y-2"><SkeletonLoader type="text" className="w-3/4 h-3.5"/><SkeletonLoader type="text" className="w-full h-10"/></div></li> ))
                                    ) : recentMessage.length > 0 ? (
                                        recentMessage.map((m) => (
                                            <li key={m._id} className="flex items-start space-x-3 group animate-fade-in">
                                                <img className="w-9 h-9 rounded-full object-cover border-2 border-gray-600 flex-shrink-0 mt-0.5 shadow-sm" src={'/images/admin.jpg'} alt={m.senderName || 'Customer'} onError={(e) => {e.target.onerror=null; e.target.src='/images/default-customer.png'}} />
                                                <div className="flex-grow bg-[#303650]/50 p-3 rounded-lg border border-gray-600/70 shadow-sm group-hover:border-emerald-500/50 transition-colors duration-200">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <Link to={`/seller/dashboard/chat-customer/${m.senderId === userInfo?._id ? m.receverId : m.senderId}`} className="text-sm font-semibold text-gray-200 hover:text-emerald-300 transition-colors"> {m.senderName || 'Customer'} </Link>
                                                        <time className="text-xs text-gray-500">{moment(m.createdAt).fromNow(true)}</time>
                                                    </div>
                                                    <p className="text-sm text-gray-300 line-clamp-2"> {m.message || '...'} </p>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-center text-sm text-gray-500 py-10 flex flex-col items-center gap-2"> <MdChat size={32} className="text-gray-600"/> No recent messages found. </li>
                                    )}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table Panel */}
                 <div className="w-full mt-8">
                     <div className="p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                           <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2"> <MdReceiptLong className="text-cyan-400"/> Recent Orders </h2>
                           <div className="flex items-center gap-2">
                               <label htmlFor="orderFilterSeller" className="text-xs text-gray-400 hidden sm:inline">Filter:</label>
                               <select id="orderFilterSeller" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="px-3 py-1 bg-[#374151]/50 border border-gray-600 rounded-md text-gray-300 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer">
                                   <option value="all">All Statuses</option> <option value="pending">Pending</option> <option value="processing">Processing</option> <option value="shipped">Shipped</option> <option value="delivered">Delivered</option> <option value="cancelled">Cancelled</option>
                               </select>
                               <Link to="/seller/dashboard/orders" className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium ml-2 hover:underline">View All</Link>
                           </div>
                       </div>
                       <div className="relative overflow-x-auto rounded-lg border border-gray-700/50">
                           <table className="w-full text-sm text-left text-gray-300">
                               <thead className="text-xs uppercase text-gray-400 bg-[#303650]/50">
                                   <tr>
                                       <th scope="col" className="py-3 px-4">Order ID</th> <th scope="col" className="py-3 px-4">Price</th> <th scope="col" className="py-3 px-4">Payment</th> <th scope="col" className="py-3 px-4">Status</th> <th scope="col" className="py-3 px-4">Date</th> <th scope="col" className="py-3 px-4 text-center">Action</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-700/50">
                                   {dashboardLoading && filteredOrders.length === 0 ? (
                                        Array.from({ length: 5 }).map((_, i) => ( <tr key={i} className="animate-pulse"><td className="py-4 px-4"><SkeletonLoader type="text" className="w-20"/></td><td className="py-4 px-4"><SkeletonLoader type="text" className="w-16"/></td><td className="py-4 px-4"><SkeletonLoader type="text" className="w-16 h-5 rounded-full"/></td><td className="py-4 px-4"><SkeletonLoader type="text" className="w-20 h-5 rounded-full"/></td><td className="py-4 px-4"><SkeletonLoader type="text" className="w-24"/></td><td className="py-4 px-4 text-center"><SkeletonLoader type="text" className="w-8 h-5 mx-auto"/></td></tr> ))
                                   ) : filteredOrders.length > 0 ? (
                                       filteredOrders.map((d) => ( <tr key={d._id} className="hover:bg-[#303650]/40 transition-colors"> <td className="py-3 px-4 font-mono text-gray-400">#{d._id?.slice(-6)}</td> <td className="py-3 px-4 font-semibold">{d.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })} DA</td> <td className="py-3 px-4"><StatusBadge status={d.payment_status} type="payment" /></td> <td className="py-3 px-4"><StatusBadge status={d.delivery_status} type="delivery" /></td> <td className="py-3 px-4 whitespace-nowrap text-gray-400">{moment(d.createdAt).format('DD MMM YYYY')}</td> <td className="py-3 px-4 text-center"><Link to={`/seller/dashboard/order/details/${d._id}`} className="font-medium text-cyan-400 hover:text-cyan-200 hover:underline transition-colors">View</Link></td> </tr> ))
                                   ) : (
                                       <tr><td colSpan="6" className="py-10 px-4 text-center text-gray-500 italic">No orders found {orderFilter !== 'all' ? `with status "${orderFilter}"` : ''}.</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>

                <Tooltip id="db-tip" place="top" style={{ backgroundColor: "#303650", color: "#e5e7eb", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", zIndex: 50 }}/>
                <style jsx>{`
                    /* Wave Background, Particles, Scrollbar */
                    .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                    @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                    .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                    @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 35, 55, 0.4); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.7); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.9); }
                    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(75, 85, 99, 0.7) rgba(30, 35, 55, 0.4); }
                    /* Fade-In Animation */
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                    /* Line clamp */
                    .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
                    .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
                    td, th { vertical-align: middle; }
                    #__react_tooltip { z-index: 999 !important; }
                `}</style>
            </div>
        </div>
    );
};

export default SellerDashboard;