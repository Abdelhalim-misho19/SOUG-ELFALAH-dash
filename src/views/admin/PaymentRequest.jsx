import React, { useEffect, useState, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { confirm_payment_request, get_payment_request, messageClear } from '../../store/Reducers/PaymentReducer';
import moment from 'moment';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners'; // Or your loader

// --- Status Badge Component (Modify or create a specific one) ---
const PaymentStatusBadge = ({ status }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-block whitespace-nowrap';
    let colors = '';
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    switch (status?.toLowerCase()) {
        case 'pending': colors = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; break;
        case 'success': // Assuming 'success' or 'approved' means confirmed
        case 'approved':
             colors = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'; break;
        case 'cancelled': // Assuming possible cancelled state
        case 'rejected':
            colors = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'; break;
        default: colors = 'bg-gray-500/20 text-gray-300 border border-gray-500/30'; break; // Fallback
    }
    return <span className={`${baseStyle} ${colors}`}>{statusText}</span>;
};
// --- End PaymentStatusBadge ---


// --- react-window scrollbar handling (Optional but recommended) ---
// This prevents default mouse wheel scrolling on the outer container
// when the list itself is scrollable, improving UX.
function handleOnWheel({ deltaY }) {
    // console.log('handleOnWheel', deltaY);
    // No default prevention needed unless specific behavior is desired
}

const outerElementType = forwardRef((props, ref) => (
    // Removed onWheel handler unless specific custom scroll logic is needed
    <div ref={ref} {...props} />
));
// --- End react-window setup ---

// Skeleton Row for Loading State
const SkeletonPaymentRow = ({ style }) => (
    <div style={style} className="flex text-sm text-gray-300 font-medium border-b border-gray-700/50 items-center animate-pulse">
        <div className="w-[5%] p-4 text-center"><div className="h-4 bg-gray-600/50 rounded w-4 mx-auto"></div></div>
        <div className="w-[25%] p-4 text-left pl-2"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></div>
        <div className="w-[20%] p-4 text-left pl-2"><div className="h-4 bg-gray-600/50 rounded w-5/6"></div></div>
        <div className="w-[15%] p-4 text-left pl-2"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></div>
        <div className="w-[10%] p-4 text-right pr-4"><div className="h-4 bg-gray-600/50 rounded w-12 ml-auto"></div></div>
        <div className="w-[10%] p-4 text-center"><div className="h-5 bg-gray-600/50 rounded-full w-16 mx-auto"></div></div>
        <div className="w-[15%] p-4 text-left pl-2"><div className="h-4 bg-gray-600/50 rounded w-20"></div></div>
        <div className="w-[10%] p-4 text-center"><div className="h-8 bg-gray-600/50 rounded-md w-20 mx-auto"></div></div>
    </div>
);


const PaymentRequest = () => {
    const dispatch = useDispatch();
    // Added loader flag from state
    const { successMessage, errorMessage, pendingWithdrows = [], loader } = useSelector((state) => state.payment);
    const [processingPaymentId, setProcessingPaymentId] = useState(null); // Track which button is loading

    useEffect(() => {
        dispatch(get_payment_request());
    }, [dispatch]);

    const confirm_request = (id) => {
        if (processingPaymentId) return; // Prevent multiple clicks while one is processing
        setProcessingPaymentId(id); // Set the ID of the payment being processed
        dispatch(confirm_payment_request(id));
    };

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            setProcessingPaymentId(null); // Clear loading state on success
            dispatch(messageClear());
            // Refetch data after confirmation
            dispatch(get_payment_request());
        }
        if (errorMessage) {
            toast.error(errorMessage);
            setProcessingPaymentId(null); // Clear loading state on error
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch]); // Removed dependency on processingPaymentId here


    // --- react-window Row Definition ---
    const Row = ({ index, style }) => {
        const withdraw = pendingWithdrows[index];
        const isCurrentLoading = loader && processingPaymentId === withdraw?._id;

        // Safer data access with optional chaining and fallbacks
        const sellerIdText = withdraw?.sellerId?._id?.toString() || 'N/A';
        const shopNameText = withdraw?.sellerId?.shopInfo?.shopName || withdraw?.sellerId?.name || 'Unknown Seller';
        const eccpText = withdraw?.sellerId?.shopInfo?.eccp || 'Not Provided';
        const amountText = `${withdraw?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} DA`;
        const dateText = withdraw?.createdAt ? moment(withdraw.createdAt).format('DD MMM YYYY, LT') : 'N/A';

        return (
            // Using style prop from react-window is crucial for positioning
            <div style={style} className="flex text-sm text-gray-300 font-medium border-b border-gray-700/50 hover:bg-[#303650]/40 items-center transition-colors duration-200">
                {/* Match widths and padding with the header divs */}
                <div className="w-[5%] p-4 text-center whitespace-nowrap text-gray-400">{index + 1}</div>
                <div className="w-[25%] p-4 text-left pl-2 whitespace-nowrap font-mono text-xs">{sellerIdText}</div>
                <div className="w-[20%] p-4 text-left pl-2 whitespace-nowrap truncate" title={shopNameText}>{shopNameText}</div>
                <div className="w-[15%] p-4 text-left pl-2 whitespace-nowrap font-mono text-xs">{eccpText}</div>
                <div className="w-[10%] p-4 text-right pr-4 whitespace-nowrap font-semibold text-emerald-300">{amountText}</div>
                <div className="w-[10%] p-4 text-center">
                    <PaymentStatusBadge status={withdraw?.status} />
                </div>
                <div className="w-[15%] p-4 text-left pl-2 whitespace-nowrap text-gray-400">{dateText}</div>
                <div className="w-[10%] p-4 text-center">
                    <button
                        disabled={isCurrentLoading} // Disable only the currently loading button
                        onClick={() => confirm_request(withdraw?._id)}
                         className={`
                            px-3 py-1.5 rounded-md text-white text-xs shadow-md transition-all duration-300 font-medium flex items-center justify-center w-20 h-8
                            ${isCurrentLoading
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30'
                            }
                        `}
                         aria-label={`Confirm payment for ${shopNameText}`}
                    >
                        {isCurrentLoading ? <BeatLoader color="#ffffff" size={6} /> : 'Confirm'}
                    </button>
                </div>
            </div>
        );
    };
    // --- End Row Definition ---

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
                        Withdrawal Requests
                    </h1>
                    {/* Add actions here if needed */}
                </div>

                {/* Main Panel */}
                <div className="w-full rounded-xl p-5 sm:p-6 bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                    {/* Optional: Add Search/Filter if needed later */}
                    {/* <div className="mb-6"> ... Search/Filter elements ... </div> */}

                    {/* Table Container */}
                    <div className="w-full overflow-hidden rounded-lg border border-gray-700/50">
                        {/* Table Header (Simulated with Flexbox) */}
                        {/* IMPORTANT: Widths MUST match the Row component's widths */}
                        <div className="flex bg-[#303650]/50 text-xs uppercase font-semibold text-gray-400 border-b border-gray-700/50">
                            <div className="w-[5%] p-4 text-center">No</div>
                            <div className="w-[25%] p-4 text-left pl-2">Seller ID</div>
                            <div className="w-[20%] p-4 text-left pl-2">Shop Name</div>
                            <div className="w-[15%] p-4 text-left pl-2">ECCP</div>
                            <div className="w-[10%] p-4 text-right pr-4">Amount</div>
                            <div className="w-[10%] p-4 text-center">Status</div>
                            <div className="w-[15%] p-4 text-left pl-2">Date</div>
                            <div className="w-[10%] p-4 text-center">Action</div>
                        </div>

                        {/* Virtualized List Body */}
                         <div className="w-full"> {/* Container for the list */}
                            {loader && pendingWithdrows.length === 0 ? ( // Show skeleton only on initial load
                                <List
                                    height={350} // Adjust height as needed
                                    itemCount={5} // Show a few skeleton rows
                                    itemSize={60} // Match itemSize used for actual Row
                                    width="100%"
                                >
                                    {SkeletonPaymentRow}
                                </List>
                            ) : pendingWithdrows.length > 0 ? (
                                <List
                                    className="List scrollbar-thin" // Add scrollbar class
                                    height={450} // Adjust list height as needed
                                    itemCount={pendingWithdrows.length}
                                    itemSize={60} // Height of each row in pixels
                                    outerElementType={outerElementType}
                                    width="100%" // Ensure list takes full width
                                >
                                    {Row}
                                </List>
                            ) : (
                                // Empty State
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No pending withdrawal requests found.
                                </div>
                            )}
                        </div>
                    </div>
                     {/* Optional: Pagination if NOT using infinite scroll */}
                     {/* If you need pagination instead of just listing all pending requests:
                         <div className="w-full flex justify-center sm:justify-end mt-6">
                              <Pagination ... />
                         </div>
                      */}
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
                /* Custom Scrollbar for react-window List */
                .List.scrollbar-thin { scrollbar-width: thin; scrollbar-color: #4b5563 #303650; }
                .List.scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
                .List.scrollbar-thin::-webkit-scrollbar-track { background: #303650; border-radius: 0 0 6px 0; /* Match panel rounding */ }
                .List.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .List.scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
            `}</style>
        </div>
    );
};

export default PaymentRequest;