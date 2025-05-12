import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaList, FaPaperPlane, FaFaceSmile } from 'react-icons/fa6';
import { IoMdClose } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import {
    get_customer_message,
    get_customers, // Fetches customers seller has interacted with
    messageClear,
    send_message, // Seller sends message to customer
    updateMessage // Updates state with message received from customer
} from '../../store/Reducers/chatReducer'; // Adjust path/names as needed
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { socket } from '../../utils/utils'; // Adjust path if needed
import moment from 'moment';
import EmojiPicker from 'emoji-picker-react';
import { BeatLoader } from 'react-spinners'; // Consistent loader

// --- Default Images ---
const defaultCustomerImage = '/images/admin.jpg'; // Placeholder for customer avatar - ADJUST PATH AS NEEDED

// --- Helper: Skeleton Loader ---
const SkeletonLoader = ({ className = "", type = "block" }) => {
    if (type === "text") return <div className={`animate-pulse bg-gray-700/60 rounded h-4 ${className}`} />;
    if (type === "title") return <div className={`animate-pulse bg-gray-700/60 rounded h-6 ${className}`} />;
    if (type === "avatar") return <div className={`animate-pulse bg-gray-700/60 rounded-full ${className}`} />;
    return <div className={`animate-pulse bg-gray-700/60 rounded ${className}`} />;
};


const SellerToCustomer = () => {
    const messagesEndRef = useRef(null);
    const dispatch = useDispatch();
    const { customerId } = useParams(); // Get selected customer ID from URL

    // --- Redux State ---
    const { userInfo } = useSelector(state => state.auth); // Seller's info
    const {
        customers = [],
        messages = [],
        currentCustomer = null,
        successMessage,
        errorMessage,
        // Add loading states if available in chatReducer
        loadingCustomers, // Loading state for the customer list
        loadingMessages, // Loading state for messages of current chat
        loader: sendingLoader // Loader specific to sending message action
    } = useSelector(state => state.chat);

    // --- Component State ---
    const [showSidebar, setShowSidebar] = useState(false);
    const [text, setText] = useState('');
    const [receivedMessage, setReceivedMessage] = useState(null); // Temp state for incoming socket message
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    // const [isTyping, setIsTyping] = useState(false); // State for customer typing indicator (optional)

    // --- Helper function for scrolling ---
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // --- Fetch Customer List ---
    useEffect(() => {
        if (userInfo?._id) {
            dispatch(get_customers(userInfo._id));
        }
    }, [userInfo?._id, dispatch]);

    // --- Fetch Messages for Selected Customer ---
    useEffect(() => {
        if (customerId) {
            dispatch(get_customer_message(customerId));
        }
        // Hide sidebar on mobile when customer changes
        if (window.innerWidth < 768) setShowSidebar(false);
        setText(''); // Clear input when changing chats
        setShowEmojiPicker(false);
    }, [customerId, dispatch]);

    // --- Send Message ---
    const send = useCallback(async (e) => {
        e.preventDefault();
        const messageText = text.trim();
        if (!messageText || !customerId || !userInfo?._id) return;

        setShowEmojiPicker(false);
        const messageData = {
            senderId: userInfo._id,
            receverId: customerId,
            text: messageText, // Backend expects 'text' based on your reducer action
            name: userInfo?.shopInfo?.shopName || userInfo?.name || 'Seller',
        };

        try {
            const resultAction = await dispatch(send_message(messageData)); // Use send_message action
            if (send_message.fulfilled.match(resultAction)) {
                const sentMessage = resultAction.payload.message;
                if (sentMessage) {
                    socket.emit('send_seller_message', sentMessage); // Emit to notify customer
                    setText('');
                    // Scroll handled by message update effect
                } else {
                    console.warn("Sent message data not found in payload:", resultAction.payload);
                }
            }
            // Errors handled by message useEffect
        } catch (err) {
            console.error("Error dispatching send_message:", err);
            // Errors handled by message useEffect
        }
    }, [text, customerId, userInfo?._id, userInfo?.name, userInfo?.shopInfo?.shopName, dispatch]);

    // --- Handle Redux Action Results ---
    useEffect(() => {
        if (successMessage) {
            // Generic success toast (maybe only needed for non-send actions)
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

    // --- Handle Incoming Socket Messages ---
    useEffect(() => {
        const handleCustomerMessage = (msg) => {
             if(msg && msg.senderId && msg.receverId) { setReceivedMessage(msg); }
             else { console.warn("Received invalid message via socket:", msg); }
        };
        // Add listener for typing if implementing
        // const handleTypingEvent = (data) => { ... };

        socket.on('customer_message', handleCustomerMessage);
        // socket.on('typing_customer', handleTypingEvent);

        return () => {
            socket.off('customer_message', handleCustomerMessage);
            // socket.off('typing_customer', handleTypingEvent);
        };
    }, []); // Listen once

    // --- Process Received Messages ---
    useEffect(() => {
        if (receivedMessage && receivedMessage.receverId === userInfo?._id) {
             if (receivedMessage.senderId === customerId) { // Message for current chat
                dispatch(updateMessage(receivedMessage));
             } else { // Message for different chat
                 toast.success(`New message from ${receivedMessage.senderName || 'a customer'}`, { /* styles */ });
                 // Update unread count logic here if implemented
                 // dispatch(updateCustomerUnread(receivedMessage.senderId));
                 // Maybe refetch customer list?
                  // dispatch(get_customers(userInfo._id));
             }
             setReceivedMessage(null);
         } else if (receivedMessage) {
             setReceivedMessage(null); // Ignore message not for this seller
         }
    }, [receivedMessage, customerId, userInfo?._id, dispatch]);


    // --- Auto-scroll ---
    useEffect(() => {
        if (customerId && messages.length > 0) {
             setTimeout(() => scrollToBottom('auto'), 100);
        }
    // }, [messages, customerId, scrollToBottom, isTyping]); // Added isTyping if using
    }, [messages, customerId, scrollToBottom]); // Removed isTyping dependency for now


    // --- Input Handlers ---
    const handleTypingInput = (e) => {
        setText(e.target.value);
        // Emit typing event if implemented
        // socket.emit('typing_seller', { senderId: userInfo._id, receverId: customerId, typing: e.target.value.length > 0 });
    };

    const handleEmojiClick = (emojiData) => {
        setText((prevText) => prevText + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Seller avatar with fallback
    const sellerAvatar = userInfo?.image || '/images/admin.jpg'; // Using admin as seller fallback

    return (
        <div className="px-4 md:px-7 py-5 min-h-screen bg-[#1a1a2e] relative overflow-hidden text-gray-200">
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a4a]/60 to-[#1a1a2e]/80 backdrop-blur-lg pointer-events-none" />

            <div className="relative z-10">
                 <div className="flex w-full h-[calc(100vh-140px)] rounded-2xl shadow-2xl overflow-hidden bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80">

                    {/* Sidebar: Customer List */}
                    <div className={`w-[280px] flex-shrink-0 h-full absolute z-20 bg-[#252A40]/95 md:bg-transparent backdrop-blur-md border-r border-gray-700/50 md:border-r-0 ${showSidebar ? 'left-0' : '-left-[336px]' } md:left-0 md:relative transition-all duration-500 ease-in-out transform md:transform-none ${ showSidebar ? 'scale-100 opacity-100' : 'scale-95 opacity-0 md:scale-100 md:opacity-100' }`}>
                        <div className="w-full h-full flex flex-col overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="flex text-xl justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                                <h2 className="text-gray-100 font-semibold tracking-wide">Customers</h2>
                                <button onClick={() => setShowSidebar(!showSidebar)} className="block md:hidden text-gray-400 hover:text-cyan-300 p-1 rounded-full hover:bg-gray-700/50 transition-all" aria-label="Close customer list"> <IoMdClose size={22} /> </button>
                            </div>
                            {/* Customer List Scrollable */}
                             <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                                {loadingCustomers ? (
                                    <div className="flex justify-center items-center h-full"> <BeatLoader color="#34d399" size={10} /> </div>
                                ) : customers.length > 0 ? (
                                    customers.map((c) => {
                                        // const isActive = false; // Placeholder for online status
                                        // const unreadCount = c.unreadCount || 0; // Placeholder
                                        return (
                                            <Link key={c.fdId} to={`/seller/dashboard/chat-customer/${c.fdId}`} onClick={() => showSidebar && setShowSidebar(false)} className={`h-auto min-h-[70px] flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 group relative overflow-hidden mb-1 ${ customerId === c.fdId ? 'bg-[#303650]/90 border border-purple-500/60 shadow-sm' : 'hover:bg-[#303650]/50' }`} aria-current={customerId === c.fdId ? "page" : undefined} >
                                                 <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="relative flex-shrink-0">
                                                        <img className="w-11 h-11 rounded-full object-cover shadow-md border-2 border-cyan-500/60" src={c.image || defaultCustomerImage} alt={c.name} onError={(e) => {e.target.onerror=null; e.target.src=defaultCustomerImage}}/>
                                                        {/* Online Indicator Placeholder */}
                                                        {/* <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#252A40] ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`}></div> */}
                                                    </div>
                                                    <div className="flex justify-center items-start flex-col w-full overflow-hidden">
                                                        <h2 className="text-sm font-medium text-gray-200 truncate">{c.name}</h2>
                                                        {/* Last Message Placeholder */}
                                                        {/* <p className="text-xs text-gray-400 truncate mt-1">{c.lastMessage || ''}</p> */}
                                                    </div>
                                                 </div>
                                                 {/* Unread Count Placeholder */}
                                                 {/* {unreadCount > 0 && customerId !== c.fdId && ( <span className="flex-shrink-0 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"> {unreadCount > 9 ? '9+' : unreadCount} </span> )} */}
                                            </Link>
                                        );
                                    })
                                ) : ( <div className="text-center text-gray-500 text-sm p-4 mt-4">No customer chats found.</div> )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-full md:w-[calc(100%-280px)] flex flex-col bg-[#1a1a2e]/50">
                         {/* Chat Header */}
                        <div className="flex justify-between items-center border-b border-gray-700/50 py-3 px-4 flex-shrink-0">
                            {customerId && currentCustomer ? (
                                <div className="flex items-center gap-3">
                                    <img className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-cyan-500/60" src={currentCustomer.image || defaultCustomerImage} alt={currentCustomer.name} onError={(e) => {e.target.onerror=null; e.target.src=defaultCustomerImage}} />
                                    <div className="flex flex-col">
                                        <span className="text-gray-100 font-semibold text-base tracking-wide">{currentCustomer.name}</span>
                                        {/* Optional Online Status */}
                                        {/* <span className={`text-xs ${currentCustomer.isOnline ? 'text-emerald-400' : 'text-gray-400'}`}>{currentCustomer.isOnline ? 'Online' : 'Offline'}</span> */}
                                    </div>
                                </div>
                            ) : ( <span className="text-gray-400 font-medium text-lg">Select a Customer</span> )}
                            <button onClick={() => setShowSidebar(!showSidebar)} className="w-9 h-9 md:hidden flex justify-center items-center rounded-lg bg-[#374151]/50 border border-gray-600 text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all" aria-label="Open customer list"> <FaList size={16} /> </button>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                            {/* Conditional Rendering for Messages */}
                            {!customerId ? (
                                 <div className="w-full h-full flex flex-col justify-center items-center text-gray-500">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-500 opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                     <span className="text-lg text-center">Select a customer<br />to view messages.</span>
                                </div>
                            ) : loadingMessages ? (
                                <div className="w-full h-full flex justify-center items-center"> <BeatLoader color="#34d399" size={12} /> </div>
                            ) : messages.length > 0 ? (
                                messages.map((m, i) => {
                                    const isSellerMessage = m.senderId === userInfo?._id;
                                    return (
                                         <div key={m._id || i} className={`flex items-end mb-3 animate-fade-in ${isSellerMessage ? 'justify-end' : 'justify-start'}`}>
                                             {!isSellerMessage && ( <img className="w-[30px] h-[30px] rounded-full object-cover border border-gray-600 flex-shrink-0 shadow-sm mr-2 mb-1" src={currentCustomer?.image || defaultCustomerImage} alt={currentCustomer?.name} onError={(e) => {e.target.onerror=null; e.target.src=defaultCustomerImage}}/> )}
                                             <div className={`relative group px-3 py-2 rounded-xl text-gray-200 shadow-md max-w-[70%] sm:max-w-[60%] ${isSellerMessage ? 'bg-gradient-to-br from-cyan-600/70 to-purple-600/70 rounded-br-none ml-auto' : 'bg-[#2a2a4a]/90 rounded-bl-none'}`}>
                                                 <span className="text-sm break-words">{m.message || m.text}</span>
                                                 <div className={`text-[10px] text-gray-400 mt-1 ${isSellerMessage ? 'text-right' : 'text-left'}`}>{moment(m.createdAt).format('LT')}</div>
                                             </div>
                                             {isSellerMessage && ( <img className="w-[30px] h-[30px] rounded-full object-cover border border-gray-600 flex-shrink-0 shadow-sm ml-2 mb-1" src={sellerAvatar} alt={userInfo?.name} onError={(e) => { e.target.onerror = null; e.target.src='/images/admin.jpg' }} /> )}
                                         </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 text-sm p-4 pt-10 italic">No messages in this chat yet. Start the conversation!</div>
                            )}
                             {/* Element to scroll to */}
                             <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Area */}
                        <div className="py-3 px-4 border-t border-gray-700/50 flex-shrink-0">
                             {customerId ? ( // Only show input if a customer is selected
                                <form onSubmit={send} className="flex gap-3 items-center relative">
                                    {/* Emoji Button */}
                                    <div className="relative">
                                        <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-[#303650]/50" aria-label="Toggle emoji picker"> <FaFaceSmile size={20} /> </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 mb-2 z-30 shadow-xl rounded-lg border border-gray-600">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" lazyLoadEmojis={true} height={350} width={300} searchPlaceholder="Search..." />
                                            </div>
                                        )}
                                    </div>
                                    {/* Text Input */}
                                    <input value={text} onChange={handleTypingInput} onFocus={() => setShowEmojiPicker(false)} className="flex-grow px-4 py-2.5 rounded-full bg-[#303650]/80 text-gray-200 placeholder-gray-400 border border-transparent focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm shadow-sm" type="text" placeholder="Type your message..." aria-label="Chat message input" />
                                    {/* Send Button */}
                                    <button type="submit" disabled={!text.trim() || sendingLoader} className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${ (!text.trim() || sendingLoader) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 hover:scale-110 hover:shadow-lg' }`} aria-label="Send message">
                                         {sendingLoader ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> ) : ( <FaPaperPlane size={16} /> )}
                                    </button>
                                </form>
                             ) : ( <div className="text-center text-gray-500 text-sm h-[56px] flex items-center justify-center">Select a customer to send a message.</div> )}
                         </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
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
                 /* Line clamp */
                 .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
                 .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
            `}</style>
        </div>
    );
};

export default SellerToCustomer;