import React, { useEffect, useState, forwardRef, useCallback } from 'react';
import { MdCurrencyExchange } from "react-icons/md";
import { FaSpinner, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { get_seller_payment_details, messageClear, send_withdrowal_request } from '../../store/Reducers/PaymentReducer'; // Adjust path/names if needed
import toast from 'react-hot-toast';
import moment from 'moment';
import { Tooltip } from 'react-tooltip'; // Added Tooltip
import 'react-tooltip/dist/react-tooltip.css'; // Tooltip CSS
import { BeatLoader } from 'react-spinners'; // Consistent Loader

// --- react-window scrollbar handling ---
const outerElementType = forwardRef((props, ref) => (
    // The scrollbar class is applied to the List component itself below
    <div ref={ref} {...props} />
));

// --- Status Badge Component ---
const WithdrawalStatusBadge = ({ status }) => {
    let baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium shadow-sm inline-flex items-center gap-1.5 border whitespace-nowrap';
    let colors = '';
    let Icon = FaHourglassHalf;
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

    switch (status?.toLowerCase()) {
        case 'pending': colors = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; Icon = FaHourglassHalf; break;
        case 'success': case 'approved': colors = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'; Icon = FaCheckCircle; break;
        case 'rejected': case 'cancelled': colors = 'bg-rose-500/10 text-rose-300 border-rose-500/30'; Icon = FaTimesCircle; break;
        default: colors = 'bg-gray-500/10 text-gray-400 border-gray-500/30'; Icon = FaHourglassHalf; break;
    }
    return (
        <span className={`${baseStyle} ${colors}`}>
            {Icon && <Icon size={12} />}
            <span className="ml-1">{statusText}</span>
        </span>
    );
};

// --- Helper: Stat Card ---
const StatCard = ({ title, value, icon, tooltip, color = 'purple', loading }) => {
    const formatValue = (val) => `${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} DA`;

    const colorClasses = {
        purple: { text: 'text-purple-400', border: 'border-purple-500/40', shadow: 'shadow-purple-500/20', iconBg: 'bg-purple-500/20', iconText: 'text-purple-300', hoverShadow: 'hover:shadow-purple-500/30' },
        cyan: { text: 'text-cyan-400', border: 'border-cyan-500/40', shadow: 'shadow-cyan-500/20', iconBg: 'bg-cyan-500/20', iconText: 'text-cyan-300', hoverShadow: 'hover:shadow-cyan-500/30' },
        green: { text: 'text-emerald-400', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/20', iconBg: 'bg-emerald-500/20', iconText: 'text-emerald-300', hoverShadow: 'hover:shadow-emerald-500/30' },
        yellow: { text: 'text-amber-400', border: 'border-amber-500/40', shadow: 'shadow-amber-500/20', iconBg: 'bg-amber-500/20', iconText: 'text-amber-300', hoverShadow: 'hover:shadow-amber-500/30' },
    };
    const styles = colorClasses[color] || colorClasses.purple;

    return (
        <div className={`flex justify-between items-center p-5 bg-[#252A40]/70 rounded-xl border ${styles.border} shadow-lg ${styles.shadow} group transition-all duration-300 ${styles.hoverShadow} hover:-translate-y-1`} data-tooltip-id="payment-tip" data-tooltip-content={tooltip}>
            {loading ? ( <div className="w-full animate-pulse"> <div className={`h-4 bg-gray-600/50 rounded w-3/5 mb-2`}></div> <div className={`h-8 bg-gray-600/50 rounded w-1/2`}></div> </div> ) : (
                <> <div className="flex flex-col space-y-0.5"> <span className="text-sm font-medium text-gray-400">{title}</span> <span className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>{formatValue(value)}</span> </div> <div className={`w-11 h-11 rounded-lg ${styles.iconBg} flex justify-center items-center ${styles.iconText} flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}> {icon || <MdCurrencyExchange size={22} />} </div> </>
            )}
        </div>
    );
};

// --- Skeleton Row ---
const SkeletonPaymentRow = ({ style }) => (
    <div style={style} className="flex text-sm text-gray-300 font-medium border-b border-gray-700/50 items-center animate-pulse">
        <div className="w-[10%] p-3 text-center"><div className="h-4 bg-gray-600/50 rounded w-4 mx-auto"></div></div>
        <div className="w-[35%] p-3"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></div>
        <div className="w-[25%] p-3 text-center"><div className="h-5 bg-gray-600/50 rounded-full w-16 mx-auto"></div></div>
        <div className="w-[30%] p-3"><div className="h-4 bg-gray-600/50 rounded w-24"></div></div>
    </div>
);

const Payments = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.auth);
    const {
        successMessage, errorMessage,
        loader: submittingWithdrawal,
        pendingWithdrows = [],
        successWithdrows = [],
        totalAmount = 0,
        withdrowAmount = 0,
        pendingAmount = 0,
        availableAmount = 0,
        loading: loadingDetails
    } = useSelector(state => state.payment);

    const [amount, setAmount] = useState('');

    // --- Fetch Payment Details ---
    useEffect(() => {
        if (userInfo?._id) { dispatch(get_seller_payment_details(userInfo._id)); }
    }, [userInfo?._id, dispatch]);

    // --- Handle Messages ---
    const handleMessages = useCallback(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
            if (successMessage.toLowerCase().includes('request sent')) {
                 setAmount('');
                 if (userInfo?._id) dispatch(get_seller_payment_details(userInfo._id));
            }
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, userInfo?._id]);

    useEffect(() => { handleMessages(); }, [handleMessages]);

    // --- Submit Withdrawal Request ---
    const sendRequest = (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) { toast.error('Please enter a valid positive amount.'); return; }
        if (numericAmount < 100) { toast.error('Minimum withdrawal amount is 100 DA.'); return; }
        if (availableAmount && numericAmount > availableAmount) { toast.error('Withdrawal amount exceeds available balance.'); return; }
        dispatch(send_withdrowal_request({ amount: numericAmount, sellerId: userInfo._id }));
    };

    // --- react-window Row Components ---
    const RowPending = ({ index, style }) => {
        const item = pendingWithdrows[index];
        return (
            <div style={style} className='flex text-sm items-center border-b border-gray-700/50 hover:bg-[#303650]/40 transition-colors duration-150'>
                <div className='w-[10%] p-3 text-center whitespace-nowrap text-gray-400'>{index + 1}</div>
                <div className='w-[35%] p-3 whitespace-nowrap text-cyan-400 font-semibold'>{item?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} DA</div>
                <div className='w-[25%] p-3 text-center whitespace-nowrap'><WithdrawalStatusBadge status={item?.status} /></div>
                <div className='w-[30%] p-3 whitespace-nowrap text-gray-400 text-xs'>{moment(item?.createdAt).format('DD MMM YYYY, LT')}</div>
            </div>
        );
    };

    const RowSuccess = ({ index, style }) => {
         const item = successWithdrows[index];
        return (
            <div style={style} className='flex text-sm items-center border-b border-gray-700/50 hover:bg-[#303650]/40 transition-colors duration-150'>
                 <div className='w-[10%] p-3 text-center whitespace-nowrap text-gray-400'>{index + 1}</div>
                 <div className='w-[35%] p-3 whitespace-nowrap text-emerald-400 font-semibold'>{item?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} DA</div>
                 <div className='w-[25%] p-3 text-center whitespace-nowrap'><WithdrawalStatusBadge status={item?.status} /></div>
                 <div className='w-[30%] p-3 whitespace-nowrap text-gray-400 text-xs'>{moment(item?.createdAt).format('DD MMM YYYY, LT')}</div>
            </div>
        );
    };

    const isLoading = loadingDetails;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
             {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-full mx-auto">
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Payments & Withdrawals</h1>
                 </div>

                {/* Summary Cards */}
                <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8'>
                     <StatCard title='Total Sales' value={totalAmount} color='cyan' tooltip='Total lifetime sales amount recorded' loading={isLoading} icon={<MdCurrencyExchange size={24}/>}/>
                     <StatCard title='Available Balance' value={availableAmount} color='purple' tooltip='Funds currently available for withdrawal' loading={isLoading} icon={<MdCurrencyExchange size={24}/>}/>
                     <StatCard title='Total Withdrawn' value={withdrowAmount} color='green' tooltip='Total amount successfully withdrawn' loading={isLoading} icon={<MdCurrencyExchange size={24}/>}/>
                     <StatCard title='Pending Withdrawal' value={pendingAmount} color='yellow' tooltip='Total amount currently pending withdrawal approval' loading={isLoading} icon={<MdCurrencyExchange size={24}/>}/>
                </div>

                {/* Withdrawal Request and Lists */}
                <div className='w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
                     {/* Withdrawal Request Section */}
                    <div className='bg-[#252A40]/70 backdrop-blur-md rounded-xl p-5 md:p-6 border border-gray-700/80 shadow-lg flex flex-col'>
                        <h2 className='text-xl font-semibold text-gray-100 pb-3 border-b border-gray-700/50 mb-5 flex-shrink-0'>Request Withdrawal</h2>
                        <div className='mb-5 flex-shrink-0'>
                             <span className='text-sm text-gray-400 block mb-0.5'>Available Balance:</span>
                             <span className='text-3xl font-bold text-emerald-400'>{availableAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'} DA</span>
                         </div>
                        <form onSubmit={sendRequest} className="flex-grow flex flex-col justify-between">
                             <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1.5">Amount to Withdraw (DA) <span className="text-rose-500">*</span></label>
                                <input id="amount" onChange={(e) => setAmount(e.target.value)} value={amount} min='100' step="1" required type="number" placeholder='Min 100 DA' className='w-full px-4 py-2.5 border rounded-lg outline-none transition-all text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400' name='amount' aria-describedby="amount-hint" />
                                 <p id="amount-hint" className="text-xs text-gray-500 mt-1">Minimum withdrawal is 100 DA.</p>
                             </div>
                            <div className="mt-6">
                                <button type="submit" disabled={submittingWithdrawal || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableAmount} className={`w-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 shadow-md text-base flex items-center justify-center gap-2 ${ (submittingWithdrawal || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableAmount) ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30' }`} aria-label="Submit withdrawal request">
                                    {submittingWithdrawal ? <BeatLoader color="#ffffff" size={8}/> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>

                     {/* History Lists Section */}
                     <div className="flex flex-col gap-6 lg:gap-8">
                         {/* Pending Requests Panel */}
                        <div className='bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-amber-500/40 shadow-lg flex flex-col overflow-hidden h-[300px]'>
                            <h2 className='text-lg font-semibold text-gray-100 pb-3 pt-5 px-5 border-b border-gray-700/50 flex-shrink-0'>Pending Requests</h2>
                            <div className='w-full overflow-hidden flex-grow'>
                                {/* Header */}
                                <div className='flex bg-[#303650]/40 text-xs uppercase font-semibold text-gray-400'>
                                    <div className='w-[10%] p-3 text-center'>#</div>
                                    <div className='w-[35%] p-3'>Amount</div>
                                    <div className='w-[25%] p-3 text-center'>Status</div>
                                    <div className='w-[30%] p-3'>Date</div>
                                </div>
                                {/* List */}
                                <div className="h-[calc(300px-40px)]"> {/* Fixed height for list content */}
                                    {isLoading && pendingWithdrows.length === 0 ? (
                                         <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">Loading...</div>
                                    ) : pendingWithdrows.length > 0 ? (
                                        <List
                                            // --- ADDED SCROLLBAR CLASS ---
                                            className='List custom-scrollbar'
                                            height={260} // Height of the scrollable area
                                            itemCount={pendingWithdrows.length}
                                            itemSize={45} // Height of each row
                                            width="100%"
                                            outerElementType={outerElementType}
                                        >
                                            {RowPending}
                                        </List>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">No pending requests.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {/* Success Withdrawals Panel */}
                        <div className='bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-emerald-500/40 shadow-lg flex flex-col overflow-hidden h-[300px]'>
                            <h2 className='text-lg font-semibold text-gray-100 pb-3 pt-5 px-5 border-b border-gray-700/50 flex-shrink-0'>Withdrawal History</h2>
                            <div className='w-full overflow-hidden flex-grow'>
                                {/* Header */}
                                <div className='flex bg-[#303650]/40 text-xs uppercase font-semibold text-gray-400'>
                                     <div className='w-[10%] p-3 text-center'>#</div>
                                     <div className='w-[35%] p-3'>Amount</div>
                                     <div className='w-[25%] p-3 text-center'>Status</div>
                                     <div className='w-[30%] p-3'>Date</div>
                                </div>
                                {/* List */}
                                <div className="h-[calc(300px-40px)]">
                                    {isLoading && successWithdrows.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">Loading...</div>
                                    ) : successWithdrows.length > 0 ? (
                                        <List
                                            // --- ADDED SCROLLBAR CLASS ---
                                            className='List custom-scrollbar'
                                            height={260}
                                            itemCount={successWithdrows.length}
                                            itemSize={45}
                                            width="100%"
                                            outerElementType={outerElementType}
                                        >
                                            {RowSuccess}
                                        </List>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">No withdrawal history yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                     </div>

                </div>
             </div>

             <Tooltip id="payment-tip" place="top" style={{ backgroundColor: "#303650", color: "#e5e7eb", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", zIndex: 50 }}/>
            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }

                /* --- Custom Scrollbar Styling --- */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px; /* Width of the scrollbar */
                    height: 6px; /* Height for horizontal scrollbar if needed */
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(30, 35, 55, 0.5); /* Darker track */
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.7); /* Gray thumb */
                    border-radius: 3px;
                    border: 1px solid rgba(30, 35, 55, 0.5); /* Subtle border matching track */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(107, 114, 128, 0.9); /* Darker gray on hover */
                }
                /* Firefox */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(75, 85, 99, 0.7) rgba(30, 35, 55, 0.5); /* thumb track */
                }

                /* Remove Number Input Spinners */
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
};

export default Payments;