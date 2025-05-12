import React, { useEffect, useRef, useState } from 'react';
import { FaList, FaPaperPlane, FaFaceSmile, FaRegFaceGrinHearts, FaCheckCircle } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import {
    get_admin_message,
    get_sellers,
    send_message_seller_admin,
    messageClear,
    updateSellerMessage,
} from '../../store/Reducers/chatReducer';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { socket } from '../../utils/utils';
import moment from 'moment';
import EmojiPicker from 'emoji-picker-react';
// Remove the incorrect import if it was still there:
// import adminIcon from '../../../public/images/admin.jpg'; // <-- DELETE THIS
import sellerIcon from '../../assets/seller.png'; // Assuming this path is correct within src

// --- Helper Component (reusable) ---
const SellerStatusIndicator = ({ isActive }) => (
    <div className="relative">
        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: isActive ? '#34D399' : '#94A3B8' }}></span>
        {/* Optionally show a tooltip on hover */}
    </div>
);

const ChatSeller = () => {
    const scrollRef = useRef(null); // Use null for initial value
    const [show, setShow] = useState(false);
    const [text, setText] = useState('');
    const [receverMessage, setReceverMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSending, setIsSending] = useState(false); // Loading state for send button

    const { sellerId } = useParams();
    const { sellers, activeSeller, seller_admin_message, currentSeller, successMessage, errorMessage } = useSelector(
        (state) => state.chat
    );
    const dispatch = useDispatch();

    // --- Helper function for scrolling to the bottom ---
    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        dispatch(get_sellers());
    }, [dispatch]);

    useEffect(() => {
        if (sellerId) {
            dispatch(get_admin_message(sellerId));
        }
    }, [sellerId, dispatch]);

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim()) return; // Prevent sending empty messages

        setIsSending(true); // Set loading state
        try {
            await dispatch(
                send_message_seller_admin({
                    senderId: '',
                    receverId: sellerId,
                    message: text,
                    senderName: 'Admin Support',
                })
            );
            setText('');
            socket.emit('typing', { senderId: '', receverId: sellerId, typing: false });
            setShowEmojiPicker(false);
            scrollToBottom(); // Scroll to the bottom after sending
        } catch (error) {
            toast.error('Failed to send message. Please try again.', {
                style: {
                    background: '#2a2a4a',
                    color: '#e5e7eb',
                    border: '1px solid #f87171', // Red border for error
                    boxShadow: '0 0 10px rgba(248,113,113, 0.3)', // Red shadow
                    borderRadius: '8px',
                },
            });
            console.error("Message send error:", error); // Log the full error
        } finally {
            setIsSending(false); // Reset loading state regardless of success/failure
        }
    };

    useEffect(() => {
        if (successMessage) {
            socket.emit('send_message_admin_to_seller', seller_admin_message[seller_admin_message.length - 1]);
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage); // Show error from server
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, seller_admin_message, dispatch]);

    useEffect(() => {
        socket.on('receved_seller_message', (msg) => {
            setReceverMessage(msg);
        });
        socket.on('typing', (data) => {
            if (data.senderId === sellerId && data.receverId === '') {
                setIsTyping(data.typing);
            }
        });
        return () => {
            socket.off('receved_seller_message');
            socket.off('typing');
        };
    }, [sellerId]);

    useEffect(() => {
        if (receverMessage) {
            if (receverMessage.senderId === sellerId && receverMessage.receverId === '') {
                dispatch(updateSellerMessage(receverMessage));
                scrollToBottom(); // Scroll to the bottom when receiving new message
            } else {
                toast.success(`${receverMessage.senderName} sent a message`, {
                    style: {
                        background: '#2a2a4a',
                        color: '#e5e7eb',
                        border: '1px solid #00e5ff',
                        boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)',
                        borderRadius: '8px',
                    },
                });
                dispatch(messageClear());
                // Don't necessarily scroll to bottom for toast notifications about *other* chats
                // scrollToBottom();
            }
        }
    }, [receverMessage, sellerId, dispatch]);

    // Initial scroll to bottom when messages load for a specific seller
    useEffect(() => {
        if (sellerId && seller_admin_message.length > 0) {
            // Delay slightly to allow rendering
             setTimeout(scrollToBottom, 100);
        }
    }, [seller_admin_message, sellerId]);


    const handleTyping = (e) => {
        setText(e.target.value);
        socket.emit('typing', { senderId: '', receverId: sellerId, typing: e.target.value.length > 0 });
    };

    const onEmojiClick = (emojiObject) => {
        setText((prevText) => prevText + emojiObject.emoji);
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-5 min-h-screen bg-[#1a1a2e] relative overflow-hidden">
            {/* Enhanced Wave Background Animation */}
            <div className="absolute inset-0 wave-bg opacity-30" />

            {/* Holographic Particle Effect */}
            <div className="absolute inset-0 particles pointer-events-none" />

            {/* Glassmorphism Overlay with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a4a]/60 to-[#1a1a2e]/80 backdrop-blur-lg" />

            {/* Main Content */}
            <div className="relative z-10">
                <div className="flex w-full h-[calc(100vh-140px)] rounded-2xl shadow-2xl overflow-hidden bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80">
                    {/* Sidebar: Seller List */}
                    <div
                        className={`w-[280px] h-full absolute z-20 bg-[#252A40]/95 md:bg-transparent backdrop-blur-md border-r border-gray-700/50 md:border-r-0 ${
                            show ? 'left-0' : '-left-[336px]'
                        } md:left-0 md:relative transition-all duration-700 ease-in-out transform md:transform-none ${
                            show ? 'scale-100 opacity-100' : 'scale-90 opacity-0 md:scale-100 md:opacity-100'
                        }`}
                    >
                        <div className="w-full h-full flex flex-col overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="flex text-xl justify-between items-center p-4 md:p-3 border-b border-gray-700/50 flex-shrink-0">
                                <h2 className="text-gray-200 font-semibold tracking-wide">Sellers</h2>
                                <button
                                    onClick={() => setShow(!show)}
                                    className="block md:hidden text-gray-300 hover:text-cyan-400 transition-all duration-300 transform hover:scale-110"
                                    aria-label="Toggle seller list"
                                >
                                    <IoMdClose size={24} />
                                </button>
                            </div>

                            {/* Seller List Scrollable Area */}
                            <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-500/70 scrollbar-track-[#1a1a2e]/50">
                                {sellers?.length > 0 ? sellers.map((s) => {
                                    const isActive = activeSeller.some((a) => a.sellerId === s._id);
                                    return (
                                        <Link
                                            key={s._id}
                                            to={`/admin/dashboard/chat-sellers/${s._id}`}
                                            onClick={() => show && setShow(false)} // Close sidebar on mobile click
                                            className={`h-[70px] flex justify-start gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 group relative overflow-hidden mb-1 ${
                                                sellerId === s._id ? 'bg-[#303650]/70 border border-purple-500/60 shadow-md' : 'hover:bg-[#303650]/50'
                                            }`}
                                        >
                                            {/* Glowing Hover Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10 flex items-center gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        className="w-[45px] h-[45px] rounded-full object-cover shadow-md border-2 border-cyan-500/60 transition-transform duration-300 group-hover:scale-110"
                                                        src={s.image || 'https://via.placeholder.com/45'} // Provide a real placeholder if needed
                                                        alt={s.name}
                                                    />
                                                    {isActive && (
                                                        <div className="absolute bottom-0 right-0">
                                                             <span className="relative flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#252A40]"></span>
                                                             </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex justify-center items-start flex-col w-full overflow-hidden">
                                                    <h2 className="text-base font-medium text-gray-200 truncate">{s.name}</h2>
                                                    <p className={`text-xs ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                        {isActive ? 'Online' : 'Offline'}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                }) : (
                                     <div className="text-center text-gray-500 text-sm p-4">No sellers found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-full md:w-[calc(100%-280px)] md:pl-4 flex flex-col bg-[#1a1a2e]/50"> {/* Added background to chat area */}
                        {/* Chat Header */}
                        <div className="flex justify-between items-center border-b border-gray-700/50 py-3 px-4 flex-shrink-0">
                            {sellerId && currentSeller ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        className="w-[40px] h-[40px] rounded-full object-cover shadow-md border-2 border-cyan-500/60 transition-transform duration-300 hover:scale-105"
                                        src={currentSeller.image || 'https://via.placeholder.com/40'}
                                        alt={currentSeller.name}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-medium text-lg tracking-wide">
                                            {currentSeller.name}
                                        </span>
                                        <span className={`text-xs ${activeSeller.some((a) => a.sellerId === sellerId) ? 'text-emerald-400' : 'text-gray-400'}`}>
                                            {activeSeller.some((a) => a.sellerId === sellerId)
                                                ? 'Online'
                                                : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-200 font-medium text-lg tracking-wide">Chat</span>
                            )}
                            <button
                                onClick={() => setShow(!show)}
                                className="w-[40px] h-[40px] md:hidden flex justify-center items-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 shadow-[0_0_12px_rgba(0,255,255,0.4)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-all duration-300 transform hover:scale-110"
                                aria-label="Toggle seller list"
                            >
                                <span className="text-white">
                                    <FaList size={20} />
                                </span>
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="p-4 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/70 scrollbar-track-[#1a1a2e]/50">
                            {sellerId ? (
                                <>
                                    {seller_admin_message.map((m, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-end mb-4 animate-slideIn ${ // items-end aligns timestamp below
                                                m.senderId === sellerId ? 'justify-start' : 'justify-end'
                                            }`}
                                            style={{ animationDelay: `${i * 50}ms` }}
                                        >
                                            {/* Seller Avatar (Left) */}
                                            {m.senderId === sellerId && (
                                                <img
                                                    className="w-[35px] h-[35px] rounded-full object-cover border-2 border-gray-600 flex-shrink-0 shadow-sm mr-2 mb-1"
                                                    src={currentSeller?.image || 'https://via.placeholder.com/35'}
                                                    alt={currentSeller?.name}
                                                />
                                            )}

                                            {/* Message Bubble */}
                                            <div
                                                className={`relative group px-4 py-3 rounded-xl text-gray-200 shadow-md max-w-[70%] sm:max-w-[60%] ${
                                                    m.senderId === sellerId
                                                        ? 'bg-[#2a2a4a]/90 rounded-bl-none' // Different rounding for direction
                                                        : 'bg-gradient-to-br from-cyan-600/50 to-purple-600/50 rounded-br-none'
                                                }`}
                                            >
                                                <span className="text-sm md:text-base block break-words">{m.message}</span>
                                                <div className={`text-[10px] text-gray-400 mt-1 ${m.senderId === sellerId ? 'text-left' : 'text-right'}`}>
                                                    {moment(m.createdAt).format('LT')}
                                                </div>
                                            </div>

                                             {/* Admin Avatar (Right) */}
                                            {m.senderId !== sellerId && (
                                                <img
                                                    className="w-[35px] h-[35px] rounded-full object-cover border-2 border-gray-600 flex-shrink-0 shadow-sm ml-2 mb-1"
                                                    src="/images/admins.jpg" // Use the correct public path
                                                    alt="Admin"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {isTyping && (
                                         <div className="w-full flex justify-start items-end mb-4 animate-slideIn">
                                            <img
                                                className="w-[35px] h-[35px] rounded-full object-cover border-2 border-gray-600 flex-shrink-0 shadow-sm mr-2 mb-1"
                                                src={currentSeller?.image || 'https://via.placeholder.com/35'}
                                                alt={currentSeller?.name}
                                            />
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#2a2a4a]/90 border border-gray-600/30 shadow-md">
                                                <div className="flex space-x-1">
                                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce"></span>
                                                    <span
                                                        className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce"
                                                        style={{ animationDelay: '0.2s' }}
                                                    ></span>
                                                    <span
                                                        className="w-2 h-2 bg-cyan-400 rounded-full animate-holographic-bounce"
                                                        style={{ animationDelay: '0.4s' }}
                                                    ></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </>
                            ) : (
                                <div className="w-full h-full flex justify-center items-center text-gray-400">
                                    <span className="text-lg animate-pulse-holographic">Select a seller to start chatting</span>
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                         <div className="py-3 px-4 border-t border-gray-700/50 flex-shrink-0">
                             {sellerId ? (
                                <form onSubmit={send} className="flex gap-3 items-center relative">
                                    <div className="relative w-full">
                                        {/* Emoji Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-all duration-300 z-10"
                                            aria-label="Toggle emoji picker"
                                        >
                                            <FaFaceSmile size={20} />
                                        </button>
                                        {/* Text Input */}
                                        <input
                                            value={text}
                                            onChange={handleTyping}
                                            className="w-full pl-10 pr-12 py-2.5 rounded-full bg-[#303650]/80 text-gray-200 placeholder-gray-400 border border-transparent focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all duration-300 text-sm md:text-base shadow-sm"
                                            type="text"
                                            placeholder="Type your message..."
                                            aria-label="Chat message input"
                                        />
                                        {/* Send Button */}
                                        <button
                                            type="submit"
                                            disabled={isSending || !text.trim()} // Disable if sending or text is empty
                                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white transition-all duration-300 ${
                                                (isSending || !text.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:from-cyan-600 hover:to-purple-700 hover:scale-110 hover:shadow-lg'
                                            }`}
                                            aria-label="Send message"
                                        >
                                            {isSending ? (
                                                // Simple spinner for sending state
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <FaPaperPlane size={14} />
                                            )}
                                        </button>
                                    </div>
                                    {/* Emoji Picker */}
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full mb-2 left-0 z-30 shadow-xl rounded-lg">
                                            <EmojiPicker
                                                onEmojiClick={onEmojiClick}
                                                theme="dark"
                                                lazyLoadEmojis={true}
                                                searchPlaceholder="Search emojis"
                                                categories={[ // Customize categories if needed
                                                    { category: 'smileys_people', name: 'Smileys & People' },
                                                    { category: 'animals_nature', name: 'Animals & Nature' },
                                                    { category: 'food_drink', name: 'Food & Drink' },
                                                    { category: 'travel_places', name: 'Travel & Places' },
                                                    { category: 'activities', name: 'Activities' },
                                                    { category: 'objects', name: 'Objects' },
                                                    { category: 'symbols', name: 'Symbols' },
                                                    { category: 'flags', name: 'Flags' },
                                                  ]}
                                            />
                                        </div>
                                    )}
                                </form>
                             ) : (
                                 <div className="text-center text-gray-500 text-sm">Select a seller to send a message.</div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                /* Wave Background Animation */
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
                /* Holographic Particle Effect */
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
                /* Slide-In Animation for Messages */
                .animate-slideIn {
                    animation: slideIn 0.4s ease-out forwards;
                    opacity: 0;
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(15px); /* Slide from bottom */
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                /* Holographic Pulse Animation */
                .animate-pulse-holographic {
                    animation: pulseHolographic 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulseHolographic {
                    0%, 100% { opacity: 0.7; text-shadow: 0 0 5px rgba(0, 229, 255, 0.5); }
                    50% { opacity: 1; text-shadow: 0 0 15px rgba(0, 229, 255, 0.8); }
                }
                /* Holographic Bounce for Typing Indicator */
                .animate-holographic-bounce {
                    animation: holographicBounce 1.2s ease-in-out infinite;
                }
                @keyframes holographicBounce {
                    0%, 100% { transform: translateY(0); box-shadow: 0 0 5px rgba(0, 229, 255, 0.5); }
                    50% { transform: translateY(-4px); box-shadow: 0 0 12px rgba(0, 229, 255, 0.8); }
                }
                /* Custom Scrollbar */
                .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #4b5563 #1a1a2e; }
                .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #1a1a2e; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
                 /* Line clamp utility */
                 .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
            `}</style>
        </div>
    );
};

export default ChatSeller;