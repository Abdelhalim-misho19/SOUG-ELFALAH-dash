import React, { forwardRef } from 'react'; // forwardRef is not needed here unless outerElementType is used
import { MdOutlineKeyboardDoubleArrowLeft, MdOutlineKeyboardDoubleArrowRight } from 'react-icons/md';

// Note: outerElementType and handleOnWheel are typically used with react-window,
// not standard pagination. Removing them unless specifically needed for another reason.
// function handleOnWheel({ deltaY }) { console.log('handleOnWheel', deltaY); }
// const outerElementType = forwardRef((props, ref) => ( <div ref={ref} onWheel={handleOnWheel} {...props} /> ));

const Pagination = ({ pageNumber, setPageNumber, totalItem, parPage, showItem = 5 }) => { // Added default for showItem

    // --- Pagination Logic ---
    let totalPage = Math.ceil(totalItem / parPage);
    if (totalPage <= 1) return null; // Don't render pagination if only one page or less

    // Clamp showItem to not exceed totalPage
    let displayItemCount = Math.min(showItem, totalPage);

    // Calculate start and end page numbers for the buttons
    let startPage = Math.max(1, pageNumber - Math.floor(displayItemCount / 2));
    let endPage = startPage + displayItemCount - 1;

    // Adjust if near the end
    if (endPage > totalPage) {
        endPage = totalPage;
        startPage = Math.max(1, endPage - displayItemCount + 1);
    }

    // --- Button Generation ---
    const createBtn = () => {
        const btns = [];
        for (let i = startPage; i <= endPage; i++) {
            const isActive = pageNumber === i;
            btns.push(
                <li key={i}>
                    <button
                        onClick={() => setPageNumber(i)}
                        className={`
                            w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center cursor-pointer
                            transition-all duration-200 ease-in-out transform
                            text-sm font-medium outline-none border
                            focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2337] focus-visible:ring-cyan-400
                            ${isActive
                                ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white border-transparent shadow-md scale-105' // Active state
                                : 'bg-[#303650]/60 border-gray-600/70 text-gray-300 hover:bg-[#374151]/80 hover:border-gray-500/80 hover:text-gray-100 hover:scale-105' // Default state
                            }
                        `}
                        aria-label={`Go to page ${i}`}
                        aria-current={isActive ? 'page' : undefined} // Accessibility for current page
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return btns;
    };

    // --- Base Button Styling ---
    const navButtonBaseStyle = `
        w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center cursor-pointer
        transition-all duration-200 ease-in-out transform
        bg-[#303650]/60 border border-gray-600/70 text-gray-400
        hover:bg-[#374151]/80 hover:border-gray-500/80 hover:text-cyan-300 hover:scale-105
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2337] focus-visible:ring-cyan-400
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#303650]/60 disabled:hover:text-gray-400
    `;

    return (
        <nav aria-label="Pagination"> {/* Use nav element */}
            <ul className="flex gap-2 items-center"> {/* Reduced gap */}
                {/* Previous Button */}
                <li>
                    <button
                        onClick={() => setPageNumber(pageNumber - 1)}
                        disabled={pageNumber === 1} // Disable if on first page
                        className={navButtonBaseStyle}
                        aria-label="Go to previous page"
                        aria-disabled={pageNumber === 1}
                    >
                        <MdOutlineKeyboardDoubleArrowLeft size={20} />
                    </button>
                </li>

                {/* Ellipsis for start if needed */}
                 {startPage > 1 && (
                     <>
                         <li>
                             <button onClick={() => setPageNumber(1)} className={`${navButtonBaseStyle} !w-auto px-3`} aria-label="Go to page 1">1</button>
                         </li>
                         {startPage > 2 && (
                             <li className="w-9 h-9 sm:w-10 sm:h-10 flex items-end justify-center text-gray-500">...</li>
                         )}
                     </>
                 )}


                {/* Pagination Number Buttons */}
                {createBtn()}

                 {/* Ellipsis for end if needed */}
                 {endPage < totalPage && (
                     <>
                         {endPage < totalPage - 1 && (
                             <li className="w-9 h-9 sm:w-10 sm:h-10 flex items-end justify-center text-gray-500">...</li>
                         )}
                         <li>
                             <button onClick={() => setPageNumber(totalPage)} className={`${navButtonBaseStyle} !w-auto px-3`} aria-label={`Go to page ${totalPage}`}>{totalPage}</button>
                         </li>
                     </>
                 )}


                {/* Next Button */}
                <li>
                    <button
                        onClick={() => setPageNumber(pageNumber + 1)}
                        disabled={pageNumber === totalPage} // Disable if on last page
                        className={navButtonBaseStyle}
                        aria-label="Go to next page"
                        aria-disabled={pageNumber === totalPage}
                    >
                        <MdOutlineKeyboardDoubleArrowRight size={20} />
                    </button>
                </li>
            </ul>
            {/* Removed embedded style block - relying on Tailwind */}
        </nav>
    );
};

export default Pagination;