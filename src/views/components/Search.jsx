import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const Search = ({ setSearchValue, searchValue }) => {
    const handleClearSearch = () => {
        setSearchValue('');
    };

    return (
        // Simplified outer div, directly controlling the relative positioning and width
        <div className="relative w-full sm:w-64 lg:w-80">
            {/* Search Icon - positioned absolutely */}
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                <FaSearch className="text-gray-400" size={16} />
            </span>

            {/* Input Field */}
            <input
                id="searchInput" // ID for potential external label association
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                // Consistent theme styling
                className={`
                    w-full pl-10 pr-10 py-2.5  /* Adjusted padding */
                    rounded-lg bg-[#303650]/80 border border-gray-600/80
                    text-gray-200 placeholder-gray-400 text-sm
                    focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none
                    transition-all duration-300 ease-in-out shadow-sm
                    hover:border-gray-500/80 /* Subtle hover border */
                `}
                aria-label="Search content" // More generic label
            />

            {/* Clear Button (Conditional) */}
            {searchValue && (
                <button
                    onClick={handleClearSearch}
                    type="button" // Explicitly set type to button
                    // Improved styling: Padding, positioning, hover effect, rounding
                    className="
                        absolute inset-y-0 right-0 flex items-center px-3
                        text-gray-400 hover:text-cyan-300
                        hover:bg-gray-600/60 rounded-r-lg
                        transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-1 focus:ring-cyan-500
                    "
                    aria-label="Clear search"
                >
                    <FaTimes size={16} />
                </button>
            )}
        </div>
    );
};

export default Search;