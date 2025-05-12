import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaPaperPlane, FaFaceSmile } from 'react-icons/fa6'; // Core icons
import { MdSupportAgent } from 'react-icons/md'; // Icon for Admin Support
import { useDispatch, useSelector } from 'react-redux';
import {
    get_seller_message, // Fetches messages between this seller and admin
    send_message_seller_admin, // Seller sends message to admin
    updateAdminMessage, // Updates state with message received from admin
    messageClear
} from '../../store/Reducers/chatReducer'; // Adjust path/names as needed
import toast from 'react-hot-toast';
import { socket } from '../../utils/utils'; // Adjust path if needed
import moment from 'moment';
import EmojiPicker from 'emoji-picker-react';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// --- Default Images ---
const defaultAdminImage = '/images/admins.jpg'; // Path relative to public folder - ADJUST IF NEEDED
const defaultSellerImage = '/images/user_placeholder.png'; // Generic fallback for seller - ADJUST IF NEEDED

// --- Helper: Skeleton Loader ---
const SkeletonLoader = ({ className = "", type = "block" }) => {
    if (type === "text") return <div className={`animate-pulse bg-gray-700/60 rounded h-4 ${className}`} />;
    if (type === "avatar") return <div className={`animate-pulse bg-gray-700/60 rounded-full ${className}`} />;
    return <div className={`animate-pulse bg-gray-700/60 rounded ${className}`} />;
};

const SellerToAdmin = () => {
    const messagesEndRef = useRef(null); // Ref specifically for the end of messages list
    const dispatch = useDispatch();

    // --- Redux State ---
    const { userInfo } = useSelector(state => state.auth); // Current Seller's info
    const {
        seller_admin_message = [], // Messages between this seller and admin
        successMessage,
        errorMessage,
        loadingMessages, // Add loading state for messages if available
        loader: sendingLoader // Loader for sending message action
    } = useSelector(state => state.chat); // Ensure slice name is correct

    // --- Component State ---
    const [text, setText] = useState('');
    const [receivedAdminMessage, setReceivedAdminMessage] = useState(null); // Temp state for incoming socket msg
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false); // Placeholder if implementing

    // --- Helper function for scrolling ---
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // --- Fetch initial messages ---
    useEffect(() => {
        dispatch(get_seller_message()); // Fetches messages for the logged-in seller with admin
    }, [dispatch]);

    // --- Send Message ---
    const send = useCallback(async (e) => {
        e.preventDefault();
        const messageText = text.trim();
        if (!messageText || !userInfo?._id) return;

        setShowEmojiPicker(false);
        const messageData = {
            senderId: userInfo._id, // Seller is the sender
            receverId: '', // Admin receiver ID (empty string based on controller)
            message: messageText, // Use 'message' key based on controller
            senderName: userInfo?.name || 'Seller', // Seller's display name
        };

        try {
            const resultAction = await dispatch(send_message_seller_admin(messageData));
            if (send_message_seller_admin.fulfilled.match(resultAction)) {
                const sentMessage = resultAction.payload.message;
                if (sentMessage) {
                    socket.emit('send_message_seller_to_admin', sentMessage); // Emit to notify admin
                    setText('');
                    // Scroll handled by message update effect
                } else {
                    console.warn("Sent message data not found in payload:", resultAction.payload);
                }
            }
            // Errors handled by message useEffect
        } catch (err) {
            console.error("Error dispatching send_message_seller_admin:", err);
            // Errors handled by message useEffect
        }
    }, [text, userInfo?._id, userInfo?.name, dispatch]);

    // --- Handle Redux Action Results ---
    useEffect(() => {
        if (successMessage) {
            // Optional: Toast for general success? Usually not needed for send.
            // toast.success(successMessage, { /* styles */ });
            if (successMessage === 'Message Send Success') {
                // Action already performed in 'send' function's success path
            }
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch]);

    // --- Handle Incoming Socket Messages from Admin ---
    useEffect(() => {
        const handleAdminMessage = (msg) => {
            // Ensure message is valid and intended for this seller
             if(msg && msg.senderId === '' && msg.receverId === userInfo?._id) { // Admin sender is '', receiver is this seller
                 setReceivedAdminMessage(msg);
             } else if (msg && msg.receverId === userInfo?._id) {
                 console.warn("Received admin message with unexpected senderId:", msg);
                 setReceivedAdminMessage(msg); // Still process if receiver matches
             } else if(msg) {
                 // console.log("Ignoring message not intended for this seller:", msg);
             } else {
                 console.warn("Received invalid message object via socket 'receved_admin_message':", msg);
             }
        };

        // Add listener for admin typing if implementing
        // const handleAdminTyping = (data) => { ... setIsAdminTyping(data.typing); ... };

        socket.on('receved_admin_message', handleAdminMessage);
        // socket.on('typing_admin_to_seller', handleAdminTyping);

        return () => {
            socket.off('receved_admin_message', handleAdminMessage);
            // socket.off('typing_admin_to_seller', handleAdminTyping);
        };
    }, [userInfo?._id]); // Re-attach listener if seller ID changes (login/logout)


    // --- Process Received Admin Messages ---
    useEffect(() => {
        if (receivedAdminMessage) {
            dispatch(updateAdminMessage(receivedAdminMessage)); // Update state
             // Send read receipt or mark as delivered?
             setReceivedAdminMessage(null); // Clear after processing
         }
    }, [receivedAdminMessage, dispatch]);


    // --- Auto-scroll ---
    useEffect(() => {
        // Scroll whenever messages change or typing indicator appears
        if (seller_admin_message.length > 0 || isAdminTyping) {
            setTimeout(() => scrollToBottom('auto'), 100);
        }
    }, [seller_admin_message, isAdminTyping, scrollToBottom]);


    // --- Input Handlers ---
    const handleTypingInput = (e) => {
        setText(e.target.value);
        // Emit typing event if implemented
        // socket.emit('typing_seller_to_admin', { senderId: userInfo._id, typing: e.target.value.length > 0 });
    };

    const handleEmojiClick = (emojiData) => {
        setText((prevText) => prevText + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // --- Seller Avatar ---
    const sellerAvatar = userInfo?.image || defaultSellerImage; // Use seller's image or default


    return (
        <div className="px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto"> {/* Centered content */}
                 {/* Header */}
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                     <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>
                        Chat with Support
                     </h1>
                      {/* Optional link back */}
                     {/* <Link to={`/seller/dashboard`} className='...'>Back to Dashboard</Link> */}
                 </div>

                 {/* Main Chat Card */}
                 <div className='w-full h-[calc(100vh-200px)] flex flex-col p-0 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-xl overflow-hidden'> {/* Adjusted height and added flex-col */}

                     {/* Chat Header */}
                     <div className="flex justify-start items-center gap-3 border-b border-gray-700/50 py-3 px-4 flex-shrink-0 bg-[#303650]/50 rounded-t-xl">
                         <div className="relative">
                             <img className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-cyan-500/60" src={defaultAdminImage} alt="Admin Support" onError={(e) => { e.target.onerror = null; e.target.src='/images/admin.jpg' }} />
                             {/* Static Online Indicator for Admin */}
                              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#303650]"></span>
                         </div>
                         <div className="flex flex-col">
                             <span className="text-gray-100 font-semibold text-base tracking-wide">Admin Support</span>
                             <span className="text-xs text-emerald-400">Online</span>
                         </div>
                     </div>

                    {/* Chat Messages Area */}
                    <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                         {/* Loading State */}
                         {loadingMessages ? ( // Check specific message loading state if available
                            <div className="w-full h-full flex justify-center items-center"> <BeatLoader color="#34d399" size={12} /> </div>
                         ) : seller_admin_message.length > 0 ? (
                             seller_admin_message.map((m, i) => {
                                const isSellerMessage = m.senderId === userInfo?._id; // Check if current user is sender
                                return (
                                     <div key={m._id || i} className={`flex items-end mb-3 animate-fade-in ${isSellerMessage ? 'justify-end' : 'justify-start'}`}>
                                         {!isSellerMessage && ( <img className="w-[30px] h-[30px] rounded-full object-cover border border-gray-600 flex-shrink-0 shadow-sm mr-2 mb-1" src={defaultAdminImage} alt="Admin" onError={(e) => { e.target.onerror = null; e.target.src='/images/admin.jpg' }}/> )}
                                         <div className={`relative group px-3 py-2 rounded-xl text-gray-200 shadow-md max-w-[70%] sm:max-w-[60%] ${isSellerMessage ? 'bg-gradient-to-br from-cyan-600/70 to-purple-600/70 rounded-br-none ml-auto' : 'bg-[#2a2a4a]/90 rounded-bl-none'}`}>
                                             <span className="text-sm break-words">{m.message}</span>
                                             <div className={`text-[10px] text-gray-400 mt-1 ${isSellerMessage ? 'text-right' : 'text-left'}`}>{moment(m.createdAt).format('LT')}</div>
                                         </div>
                                         {isSellerMessage && ( <img className="w-[30px] h-[30px] rounded-full object-cover border border-gray-600 flex-shrink-0 shadow-sm ml-2 mb-1" src={sellerAvatar} alt={userInfo?.name} onError={(e) => { e.target.onerror = null; e.target.src=defaultSellerImage }} /> )}
                                     </div>
                                );
                            })
                         ) : (
                            <div className="text-center text-gray-500 text-sm p-4 pt-10 italic">No messages yet. Send a message to Admin Support.</div>
                         )}
                          {/* Admin Typing Indicator Placeholder */}
                         {isAdminTyping && (
                             <div className="w-full flex justify-start items-end mb-3 animate-fade-in">
                                 <img className="w-[30px] h-[30px] rounded-full object-cover border border-gray-600 flex-shrink-0 shadow-sm mr-2 mb-1" src={defaultAdminImage} alt="Typing" />
                                 <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a4a]/90 rounded-bl-none shadow-md">
                                     <div className="flex space-x-1">
                                         <span className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce"></span>
                                         <span className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce" style={{ animationDelay: '0.2s' }}></span>
                                         <span className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce" style={{ animationDelay: '0.4s' }}></span>
                                     </div>
                                 </div>
                             </div>
                         )}
                          <div ref={messagesEndRef} /> {/* Scroll target */}
                    </div>

                    {/* Message Input Area */}
                    <div className="py-3 px-4 border-t border-gray-700/50 flex-shrink-0">
                         <form onSubmit={send} className="flex gap-3 items-center relative">
                             <div className="relative"> {/* Emoji button container */}
                                 <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-[#303650]/50" aria-label="Toggle emoji picker"> <FaFaceSmile size={20} /> </button>
                                 {showEmojiPicker && (
                                     <div className="absolute bottom-full left-0 mb-2 z-30 shadow-xl rounded-lg border border-gray-600">
                                         <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" lazyLoadEmojis={true} height={350} width={300} searchPlaceholder="Search..." />
                                     </div>
                                 )}
                             </div>
                             <input value={text} onChange={handleTypingInput} onFocus={() => setShowEmojiPicker(false)} className="flex-grow px-4 py-2.5 rounded-full bg-[#303650]/80 text-gray-200 placeholder-gray-400 border border-transparent focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm shadow-sm" type="text" placeholder="Type your message to support..." aria-label="Chat message input" />
                             <button type="submit" disabled={!text.trim() || sendingLoader} className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${ (!text.trim() || sendingLoader) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 hover:scale-110 hover:shadow-lg' }`} aria-label="Send message">
                                  {sendingLoader ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> ) : ( <FaPaperPlane size={16} /> )}
                             </button>
                         </form>
                    </div>
                 </div>
            </div>

            <style jsx>{`
                 /* Wave Background & Particles */
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                /* Fade-In Animation */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                 /* Holographic Bounce Animation */
                 .animate-holographic-bounce { animation: holographicBounce 1.2s infinite ease-in-out; }
                 @keyframes holographicBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
                 /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.6); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.8); }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(75, 85, 99, 0.6) transparent; }
            `}</style>
        </div>
    );
};

export default SellerToAdmin;