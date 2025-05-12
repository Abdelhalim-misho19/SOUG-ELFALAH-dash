import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination';
import { FaEye, FaUserCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Search from '../components/Search';
import { get_deactive_sellers } from '../../store/Reducers/sellerReducer'; // Use the correct action
import { BeatLoader } from 'react-spinners';

// --- Re-use or Define SellerStatusBadge ---
const SellerStatusBadge = ({ status, type }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    if (type === 'payment') {
        // Assuming 'active' is the positive state, others are negative/inactive
        colors = status?.toLowerCase() === 'active'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else { // Account Status
        switch (status?.toLowerCase()) {
            case 'active': colors = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'; break;
            case 'pending': colors = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; break;
            case 'deactive': default: colors = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'; break; // Deactive is default here
        }
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};
// --- End SellerStatusBadge ---

// Skeleton Loader for Table Rows (Same as Sellers)
const SkeletonSellerRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-4"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-11 w-11 bg-gray-600/50 rounded-full"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-24"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-20"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-5 bg-gray-600/50 rounded-full w-16"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-32"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-5 bg-gray-600/50 rounded-full w-16"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-16"></div></td>
        <td className="py-4 px-4 sm:px-6 text-center"><div className="h-8 w-8 bg-gray-600/50 rounded-md mx-auto"></div></td>
    </tr>
);


const DeactiveSellers = () => {
    const dispatch = useDispatch();
    // Add loading state if available in sellerReducer
    const { sellers = [], totalSeller = 0, loadingSellers } = useSelector((state) => state.seller);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(5);

    useEffect(() => {
        const obj = {
            parPage: parseInt(parPage),
            page: parseInt(currentPage),
            searchValue,
        };
        dispatch(get_deactive_sellers(obj)); // Dispatch the correct action
    }, [searchValue, currentPage, parPage, dispatch]);

    // Use loadingSellers if defined, otherwise derive simply
    const isLoading = loadingSellers === undefined ? !sellers : loadingSellers;


    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-full mx-auto">
                 {/* Page Header */}
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
                        Deactivated Sellers
                    </h1>
                     {/* Optional Link to Active Sellers */}
                     <Link to="/admin/dashboard/sellers" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                         View Active Sellers →
                     </Link>
                </div>

                {/* Main Panel */}
                <div className="w-full rounded-xl p-5 sm:p-6 bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">

                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <Search
                            setSearchValue={setSearchValue}
                            searchValue={searchValue}
                        />
                        <div className="flex items-center gap-3">
                            <label htmlFor="deactiveSellerParPage" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                            <select
                                id="deactiveSellerParPage" // Unique ID
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

                    {/* Sellers Table Container */}
                    <div className="relative overflow-x-auto rounded-lg border border-gray-700/50">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs uppercase text-gray-400 bg-[#303650]/50">
                                <tr>
                                    {/* Adjusted Headers - Removed Status as all should be 'deactive' */}
                                    <th scope="col" className="py-3 px-4 sm:px-6 w-12">No</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">Image</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">Name</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">Shop Name</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">Payment</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">Email</th>
                                    {/* Removed Status Column */}
                                    <th scope="col" className="py-3 px-4 sm:px-6">Division</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6">District</th>
                                    <th scope="col" className="py-3 px-4 sm:px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {isLoading ? (
                                    Array.from({ length: parPage }).map((_, i) => <SkeletonSellerRow key={i} />)
                                ) : sellers?.length > 0 ? (
                                    sellers.map((d, i) => (
                                        <tr key={d._id} className="hover:bg-[#303650]/40 transition-colors">
                                            <td className="py-3 px-4 sm:px-6 font-medium text-gray-400">{(currentPage - 1) * parPage + i + 1}</td>
                                            <td className="py-3 px-4 sm:px-6">
                                                {d.image ? (
                                                    <img className="w-11 h-11 rounded-full object-cover border-2 border-gray-600 shadow-sm opacity-70" // Added opacity
                                                         src={d.image} alt={d.name} loading="lazy" />
                                                ) : (
                                                    <span className="flex justify-center items-center w-11 h-11 rounded-full bg-gray-700 text-gray-500 border-2 border-gray-700 opacity-70">
                                                         <FaUserCircle size={20} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 sm:px-6 font-medium text-gray-200 whitespace-nowrap">{d.name || 'N/A'}</td>
                                            <td className="py-3 px-4 sm:px-6 text-gray-300 whitespace-nowrap">{d.shopInfo?.shopName || 'N/A'}</td>
                                            <td className="py-3 px-4 sm:px-6"> <SellerStatusBadge status={d.payment} type="payment" /> </td>
                                            <td className="py-3 px-4 sm:px-6 text-gray-300 whitespace-nowrap">{d.email || 'N/A'}</td>
                                            {/* Removed Status Cell - all are deactive */}
                                            <td className="py-3 px-4 sm:px-6 text-gray-300 whitespace-nowrap">{d.shopInfo?.division || 'N/A'}</td>
                                            <td className="py-3 px-4 sm:px-6 text-gray-300 whitespace-nowrap">{d.shopInfo?.district || 'N/A'}</td>
                                            <td className="py-3 px-4 sm:px-6 text-center">
                                                <Link
                                                    to={`/admin/dashboard/seller/details/${d._id}`}
                                                    className="p-2 inline-flex items-center justify-center text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-md transition-all duration-300"
                                                    aria-label={`View details for ${d.name}`}
                                                >
                                                    <FaEye size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        {/* Adjusted colspan */}
                                        <td colSpan="8" className="py-8 px-4 sm:px-6 text-center text-gray-500 text-sm">
                                            No deactivated sellers found{searchValue ? ` matching "${searchValue}"` : ''}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalSeller > parPage && (
                        <div className="w-full flex justify-center sm:justify-end mt-6">
                            <Pagination
                                pageNumber={currentPage}
                                setPageNumber={setCurrentPage}
                                totalItem={totalSeller}
                                parPage={parPage}
                                showItem={3}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                /* Particles */
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
            `}</style>
        </div>
    );
};

export default DeactiveSellers;