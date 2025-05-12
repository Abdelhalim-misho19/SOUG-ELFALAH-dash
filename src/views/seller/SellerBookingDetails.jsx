import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { get_booking_details, update_booking_status, messageClear } from '../../store/Reducers/BookingReducer'; // Adjust path if needed

// --- CORRECTED ICON IMPORTS ---
// Import icons likely in fa6
import { FaBox, FaClipboardList, FaGear, FaTruckFast, FaCircleCheck, FaCircleXmark, FaSpinner, FaArrowLeft } from 'react-icons/fa6';
// Import icons that might be in general fa (FA5) or have different names in fa6
import { FaUserCircle, FaConciergeBell, FaCalendarAlt, FaClock, FaStickyNote, FaInfoCircle } from 'react-icons/fa'; // Changed from fa6 to fa
// --- END ICON IMPORTS ---

import moment from 'moment';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// --- Reusable Status Badge ---
const BookingStatusBadge = ({ status }) => {
    let baseStyle = 'px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5';
    let colors = '';
    let Icon = FaInfoCircle; // Default icon (Imported from fa)

    switch (status?.toLowerCase()) {
        case 'pending': colors = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; Icon = FaClipboardList; break; // fa6
        case 'confirmed': colors = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'; Icon = FaCircleCheck; break; // fa6
        case 'completed': colors = 'bg-sky-500/10 text-sky-300 border-sky-500/30'; Icon = FaCircleCheck; break; // fa6
        case 'cancelled': colors = 'bg-rose-500/10 text-rose-300 border-rose-500/30'; Icon = FaCircleXmark; break; // fa6
        // Add other potential statuses like 'processing', 'no-show', etc.
         case 'processing': colors = 'bg-blue-500/10 text-blue-300 border-blue-500/30'; Icon = FaGear; break; // fa6
         case 'shipped': colors = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'; Icon = FaTruckFast; break; // fa6
        default: colors = 'bg-gray-500/10 text-gray-400 border-gray-500/30'; Icon = FaInfoCircle; break; // fa
    }
    const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    return (
        <span className={`${baseStyle} ${colors}`}>
            {Icon && <Icon size={12} />} {/* Render icon if available */}
            <span className="ml-1">{statusText}</span> {/* Added margin */}
        </span>
    );
};

// --- Reusable Info Row ---
const InfoDisplay = ({ label, value, icon, isCurrency = false }) => (
    <div className="flex items-start gap-2 py-1.5"> {/* Adjusted for vertical alignment */}
        {icon && React.createElement(icon, { className: "text-gray-400 w-4 h-4 flex-shrink-0 mt-0.5" })} {/* Icon styling */}
        <span className="text-sm font-medium text-gray-400 w-[70px] shrink-0">{label}:</span>
        <span className={`text-sm ${isCurrency ? 'font-semibold text-emerald-300' : 'text-gray-200'} break-words`}> {/* Added break-words */}
            {value || <span className="italic text-gray-500">N/A</span>}
        </span>
    </div>
);


const SellerBookingDetails = () => {
    const { bookingId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentBooking, loader: bookingLoader, successMessage, errorMessage } = useSelector(state => state.booking);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

    // --- Fetch Data ---
    useEffect(() => {
        if (bookingId) {
            dispatch(get_booking_details(bookingId));
        }
        return () => { dispatch(messageClear()); };
    }, [bookingId, dispatch]);

    // --- Handle Messages ---
    const handleMessages = useCallback(() => {
         if (successMessage) {
             toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #34d399' }});
             dispatch(messageClear());
             setIsLoadingUpdate(false);
         }
         if (errorMessage) {
             toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }});
             dispatch(messageClear());
             setIsLoadingUpdate(false);
         }
    }, [successMessage, errorMessage, dispatch]);

    useEffect(() => {
        handleMessages();
    }, [handleMessages]);

    // --- Update Status ---
    const handleUpdateStatus = async (newStatus) => {
        if (isLoadingUpdate || bookingLoader) return;
        setIsLoadingUpdate(true);
        try {
             await dispatch(update_booking_status({ bookingId, status: newStatus })).unwrap();
             dispatch(get_booking_details(bookingId)); // Refetch details after update
         } catch (err) {
              console.error("Status update error:", err);
              setIsLoadingUpdate(false); // Reset loader on caught error
          }
    };

    // --- Formatting Helpers ---
    const formatDate = (dateString) => dateString ? moment(dateString).format('dddd, MMMM Do YYYY') : null;
    const formatTime = (timeString) => timeString ? moment(timeString, "HH:mm").format('hh:mm A') : null;
    const formatCreatedAt = (dateString) => dateString ? moment(dateString).fromNow() : 'N/A';

    // --- Determine Action Availability ---
    const canConfirm = currentBooking?.status?.toLowerCase() === 'pending';
    const canCancel = ['pending', 'confirmed'].includes(currentBooking?.status?.toLowerCase());
    const canComplete = currentBooking?.status?.toLowerCase() === 'confirmed'; // Example logic

    // --- Loading State ---
    if (bookingLoader && !currentBooking?._id) {
         return (
             <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center'>
                 <BeatLoader color="#34d399" size={15} />
             </div>
         );
     }

     // --- Error State / Not Found ---
    if (!bookingLoader && !currentBooking?._id && bookingId) {
        return (
             <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex flex-col justify-center items-center text-center'>
                 <h2 className="text-xl text-red-400 mb-4">{errorMessage || "Booking Not Found"}</h2>
                 <p className="text-gray-400 mb-6">The requested booking could not be loaded or does not exist.</p>
                 <Link to="/seller/dashboard/bookings" className='bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2'>
                     <FaArrowLeft size={14}/> Back to Bookings List
                 </Link>
             </div>
          );
     }

     // --- Safety Check ---
     if (!currentBooking?._id) return null;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                 <div className="mb-6">
                      <Link to="/seller/dashboard/bookings" className='text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors group'>
                         <FaArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform"/> Back to Bookings
                     </Link>
                 </div>

                 <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-xl'>
                     <div className='flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-700/50 mb-6'>
                        <div>
                            <h2 className='text-xl md:text-2xl font-bold text-gray-100 tracking-tight mb-1'>Booking Details</h2>
                             <div className='flex items-center gap-2 text-xs sm:text-sm'>
                                <span className="text-cyan-400 font-medium font-mono">ID: #{currentBooking._id.slice(-8).toUpperCase()}</span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-500">Booked: {formatCreatedAt(currentBooking.createdAt)}</span>
                             </div>
                        </div>
                        <div className='flex-shrink-0 pt-1'>
                             <BookingStatusBadge status={currentBooking.status} />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8'>
                        <div className="bg-[#1e2337]/60 p-4 rounded-lg border border-gray-700/50">
                            <h3 className='text-base font-semibold text-gray-200 mb-3 flex items-center gap-2'> <FaUserCircle className="text-sky-400"/> Customer</h3>
                            <div className="space-y-1">
                                 <InfoDisplay label="Name" value={currentBooking.userName} />
                                 <InfoDisplay label="Phone" value={currentBooking.userPhone} />
                            </div>
                        </div>
                         <div className="bg-[#1e2337]/60 p-4 rounded-lg border border-gray-700/50">
                            <h3 className='text-base font-semibold text-gray-200 mb-3 flex items-center gap-2'> <FaConciergeBell className="text-purple-400"/> Service</h3>
                            <div className="space-y-1">
                                 <InfoDisplay label="Name" value={currentBooking.serviceName} />
                                 <InfoDisplay label="Price" value={`${currentBooking.servicePrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })} DA`} isCurrency={true} />
                            </div>
                        </div>
                         <div className="bg-[#1e2337]/60 p-4 rounded-lg border border-gray-700/50">
                            <h3 className='text-base font-semibold text-gray-200 mb-3 flex items-center gap-2'> <FaCalendarAlt className="text-amber-400"/> Appointment</h3>
                            <div className="space-y-1">
                                 <InfoDisplay label="Date" value={formatDate(currentBooking.date)} icon={FaCalendarAlt} />
                                 <InfoDisplay label="Time" value={formatTime(currentBooking.time)} icon={FaClock} />
                            </div>
                        </div>
                    </div>

                    {currentBooking.notes && (
                        <div className="mb-8">
                             <h3 className='text-base font-semibold text-gray-200 mb-2 flex items-center gap-2'> <FaStickyNote className="text-gray-400"/> Notes from Customer</h3>
                             <p className='text-sm text-gray-300 bg-[#1e2337]/60 p-4 rounded border border-gray-700/50 italic leading-relaxed whitespace-pre-wrap'>
                                {currentBooking.notes}
                             </p>
                        </div>
                     )}

                     <div className='mt-6 pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-end items-center gap-4'>
                          {/* --- Conditional Actions --- */}
                         {canConfirm && ( // Only show if status is Pending
                             <>
                                <button
                                    onClick={() => handleUpdateStatus('Cancelled')}
                                    disabled={isLoadingUpdate}
                                    className={`w-full sm:w-auto min-w-[150px] text-center bg-gradient-to-br from-rose-500 to-red-700 hover:from-rose-600 hover:to-red-800 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:from-gray-600 disabled:to-gray-700`}
                                >
                                    {isLoadingUpdate ? <FaSpinner className="animate-spin" /> : <FaCircleXmark size={16}/>}
                                    Reject Booking
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('Confirmed')}
                                    disabled={isLoadingUpdate}
                                    className={`w-full sm:w-auto min-w-[150px] text-center bg-gradient-to-br from-emerald-500 to-green-700 hover:from-emerald-600 hover:to-green-800 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:from-gray-600 disabled:to-gray-700`}
                                >
                                     {isLoadingUpdate ? <FaSpinner className="animate-spin" /> : <FaCircleCheck size={16}/>}
                                    Confirm Booking
                                </button>
                             </>
                         )}
                          {canComplete && ( // Only show if status is Confirmed
                             <button
                                onClick={() => handleUpdateStatus('Completed')}
                                disabled={isLoadingUpdate}
                                className={`w-full sm:w-auto min-w-[150px] text-center bg-gradient-to-br from-sky-500 to-blue-700 hover:from-sky-600 hover:to-blue-800 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:from-gray-600 disabled:to-gray-700`}
                             >
                                  {isLoadingUpdate ? <FaSpinner className="animate-spin" /> : <FaCircleCheck size={16}/>}
                                  Mark as Completed
                             </button>
                           )}
                           {/* Message for already completed/cancelled */}
                           {!canConfirm && !canComplete && currentBooking.status && (
                              <div className='text-sm text-gray-500 italic text-right w-full'>
                                 This booking is already {currentBooking.status?.toLowerCase()}. No further actions available.
                              </div>
                           )}
                           {/* End Conditional Actions */}
                     </div>
                 </div>
            </div>

            <style jsx>{`
                /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Slow spin */
                 @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                 .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                 /* Date input icon color */
                 input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) brightness(0.8); cursor: pointer; }
            `}</style>
        </div>
    );
};

export default SellerBookingDetails;