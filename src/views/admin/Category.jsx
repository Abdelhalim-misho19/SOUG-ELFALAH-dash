import React, { useEffect, useState, useCallback } from 'react';
// import { Link } from 'react-router-dom';
import Pagination from '../Pagination';
import { FaEdit, FaTrash, FaImage, FaPlus } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle } from '../../utils/utils';
import { categoryAdd, messageClear, get_category, updateCategory, deleteCategory } from '../../store/Reducers/categoryReducer';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Search from '../components/Search';
import Swal from 'sweetalert2'; // <--- Import SweetAlert2

// Skeleton Loader Component (Visual enhancement from File 1 design)
// NOTE: Add 'loadingCategories' to useSelector below if your 'category' state provides it
const SkeletonRow = () => (
    <tr className="border-b border-gray-700/50 animate-pulse">
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-4"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-12 w-12 bg-gray-600/50 rounded-md"></div></td>
        <td className="py-4 px-4 sm:px-6"><div className="h-4 bg-gray-600/50 rounded w-3/4"></div></td>
        <td className="py-4 px-4 sm:px-6">
            <div className="flex gap-2 sm:gap-3 justify-center"> {/* Centered actions */}
                <div className="h-8 w-8 bg-gray-600/50 rounded-md"></div>
                <div className="h-8 w-8 bg-gray-600/50 rounded-md"></div>
            </div>
        </td>
    </tr>
);


const Category = () => {
    const dispatch = useDispatch();
    const { loader, successMessage, errorMessage, categorys = [], totalItems = 0 /* , loadingCategories */ } = useSelector(state => state.category);

    // --- STATE VARIABLES (FROM WORKING FILE) ---
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [parPage, setParPage] = useState(5);
    const [show, setShow] = useState(false);
    const [imageShow, setImage] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [state, setState] = useState({ name: '', image: '' });
    // --- END STATE VARIABLES ---

    // --- EVENT HANDLERS (FROM WORKING FILE - UNCHANGED LOGIC, except handleDelete) ---
    const imageHandle = (e) => {
        let files = e.target.files;
        if (files.length > 0) {
             const file = files[0];
             const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
              if (!allowedTypes.includes(file.type)) {
                  toast.error('Invalid file type. Please select an image (JPG, PNG, WEBP, GIF).');
                  return;
              }
              if (file.size > 2 * 1024 * 1024) { // 2MB limit
                   toast.error('Image size exceeds 2MB limit.');
                   return;
              }
            setImage(URL.createObjectURL(files[0]));
            setState({ ...state, image: files[0] });
        }
    };

    const addOrUpdateCategory = (e) => {
        e.preventDefault();
         if (!state.name.trim()) {
            toast.error("Category name is required.");
            return;
         }
         if (!isEdit && !state.image) {
             toast.error("Image is required for new category.");
             return;
         }
        if (isEdit) {
            dispatch(updateCategory({ id: editId, ...state }));
        } else {
            dispatch(categoryAdd(state));
        }
    };

    const handleEdit = (category) => {
        setState({ name: category.name, image: category.image });
        setImage(category.image);
        setEditId(category._id);
        setIsEdit(true);
        setShow(true);
    };

    // --- Updated handleDelete using SweetAlert2 ---
    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Deleting this category might also affect products using it.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Red color for confirm button
            cancelButtonColor: '#3085d6', // Blue color for cancel button
            confirmButtonText: 'Yes, delete it!',
            // Optional: Add custom classes for more specific styling if needed
            // customClass: {
            //     popup: 'your-popup-class',
            //     confirmButton: 'your-confirm-button-class',
            //     cancelButton: 'your-cancel-button-class'
            // }
        }).then((result) => {
            if (result.isConfirmed) {
                // If confirmed, dispatch the delete action
                dispatch(deleteCategory(id));
                // Optional: Show success toast after dispatch (though your useEffect already handles this)
                // Swal.fire(
                //   'Deleted!',
                //   'The category has been deleted.',
                //   'success'
                // )
            }
        });
    };
    // --- END EVENT HANDLERS ---

    // --- USEEFFECT HOOKS (FROM WORKING FILE - UNCHANGED LOGIC) ---
    useEffect(() => {
        if (successMessage) {
            // Check if the success message is related to deletion to avoid double alerts
            if (!successMessage.toLowerCase().includes('deleted')) {
                toast.success(successMessage);
            }
            dispatch(messageClear());
            setState({ name: '', image: '' });
            setImage('');
            setIsEdit(false);
            setEditId(null);
            setShow(false);
             const fileInput = document.getElementById('image_cat_input');
             if (fileInput) { fileInput.value = null; }
        }
        if (errorMessage) {
            toast.error(errorMessage);
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch]);

    useEffect(() => {
        const obj = { parPage: parseInt(parPage), page: parseInt(currentPage), searchValue };
        dispatch(get_category(obj));
    }, [searchValue, currentPage, parPage, dispatch]);
    // --- END USEEFFECT HOOKS ---

     // --- HELPERS (Derived from working file logic for clarity, matching File 1 style) ---
     const resetForm = useCallback(() => {
        setState({ name: '', image: '' });
        setImage('');
        setIsEdit(false);
        setEditId(null);
        const fileInput = document.getElementById('image_cat_input');
        if (fileInput) fileInput.value = null;
    }, []);

     const resetAndCloseForm = () => {
        resetForm();
        setShow(false);
     }

     const openAddForm = () => {
        resetForm();
        setShow(true);
     };
    // --- END HELPERS ---

    return (
        // Apply File 1's outer container styling and background
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden">
            {/* Background Effects from File 1 */}
            <div className="absolute inset-0 wave-bg opacity-10" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm" />

            {/* Main Content Area Wrapper (from File 1) */}
            <div className="relative z-10 max-w-full mx-auto">
                 {/* Header structure and styling from File 1 */}
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
                        Product Categories {/* Title from File 1 */}
                    </h1>
                     {/* Button from File 1 (always visible, styled) */}
                    
                </div>

                {/* Main Content Layout (from File 1 design) */}
                <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-8"> {/* Gap from File 1 */}
                    {/* Table Section - Use File 1's width classes */}
                    <div className="w-full lg:w-7/12 xl:w-8/12 flex-shrink-0"> {/* Widths & shrink from File 1 */}
                        {/* Card Styling from File 1 */}
                        <div className="w-full p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg">
                             {/* Search/Filter Row structure and styling from File 1 */}
                             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <Search setParPage={setParPage} setSearchValue={setSearchValue} searchValue={searchValue} />
                                <div className="flex items-center gap-3">
                                    <label htmlFor="tableParPageCat" className="text-sm text-gray-400 whitespace-nowrap">Show:</label>
                                    <select
                                        id="tableParPageCat" // Unique ID
                                        onChange={(e) => { setParPage(parseInt(e.target.value)); setCurrentPage(1); }}
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

                            {/* Table Container - Apply File 1 Styles */}
                            <div className="relative overflow-x-auto rounded-lg border border-gray-700/50">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-xs uppercase text-gray-400 bg-[#303650]/50">
                                        <tr>
                                            <th scope="col" className="py-3 px-4 sm:px-6 w-12">No</th>
                                            <th scope="col" className="py-3 px-4 sm:px-6 min-w-[80px]">Image</th>
                                            <th scope="col" className="py-3 px-4 sm:px-6">Name</th>
                                            <th scope="col" className="py-3 px-4 sm:px-6 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {/* {loadingCategories ? (...) : ... } */}
                                        { categorys && categorys.length > 0 ? (
                                            categorys.map((d, i) => (
                                                <tr key={d._id} className="hover:bg-[#303650]/40 transition-colors">
                                                    <td className="py-3 px-4 sm:px-6 font-medium text-gray-400">
                                                        {(currentPage - 1) * parPage + i + 1}
                                                    </td>
                                                    <td className="py-3 px-4 sm:px-6">
                                                        <img className="w-12 h-12 rounded-md object-cover border border-gray-600 shadow-sm" src={d.image} alt={d.name} loading="lazy" />
                                                    </td>
                                                    <td className="py-3 px-4 sm:px-6 font-medium text-gray-200">{d.name}</td>
                                                    <td className="py-3 px-4 sm:px-6">
                                                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                                                            <button onClick={() => handleEdit(d)} className="p-2 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md transition-all duration-300" aria-label={`Edit ${d.name}`}> <FaEdit size={14} /> </button>
                                                            {/* handleDelete now uses SweetAlert */}
                                                            <button onClick={() => handleDelete(d._id)} className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-all duration-300" aria-label={`Delete ${d.name}`}> <FaTrash size={14} /> </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr> <td colSpan="4" className="py-8 px-4 sm:px-6 text-center text-gray-500 text-sm"> No product categories found{searchValue ? ` matching "${searchValue}"` : ''}. </td> </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalItems > 0 && totalItems > parPage && (
                                <div className="w-full flex justify-center sm:justify-end mt-6">
                                    <Pagination pageNumber={currentPage} setPageNumber={setCurrentPage} totalItem={totalItems} parPage={parPage} showItem={3} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div key={editId || 'add'} className={`lg:w-5/12 xl:w-4/12 flex-shrink-0 ${show ? 'block' : 'hidden'} lg:block`}>
                        <div className={`w-full p-5 sm:p-6 rounded-xl bg-[#252A40]/70 backdrop-blur-md border border-gray-700/80 shadow-lg lg:sticky lg:top-8 ${show ? 'fixed inset-0 z-50 bg-[#111827]/90 backdrop-blur-lg overflow-y-auto lg:static lg:inset-auto lg:z-auto lg:overflow-y-visible lg:bg-[#252A40]/70' : ''}`}>
                             <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-700/50">
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-100">
                                    {isEdit ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                <button onClick={resetAndCloseForm} className="text-gray-400 hover:text-rose-400 bg-gray-700/50 hover:bg-rose-500/20 p-1.5 rounded-full transition-all lg:hidden" aria-label="Close form">
                                    <IoMdClose size={20} />
                                </button>
                            </div>

                             <form onSubmit={addOrUpdateCategory}>
                                <div className="flex flex-col gap-5">
                                    {/* Name Input */}
                                     <div>
                                        <label htmlFor="category_name_input" className="block text-sm font-medium text-gray-300 mb-1.5"> Category Name <span className="text-rose-500">*</span> </label>
                                        <input value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400" type="text" id="category_name_input" name="category_name" placeholder="e.g., seeds" required />
                                    </div>

                                     {/* Image Upload */}
                                    <div>
                                         <label className="block text-sm font-medium text-gray-300 mb-1.5"> Category Image {isEdit ? '(Optional: change)' : <span className="text-rose-500">*</span>} </label>
                                         <label className={`flex justify-center items-center flex-col h-48 w-full cursor-pointer border-2 border-dashed rounded-lg transition-all duration-300 ${ imageShow ? 'border-cyan-500/50 p-1 bg-[#303650]/30' : 'border-gray-600 hover:border-purple-500 bg-[#303650]/60' }`} htmlFor="image_cat_input">
                                             {imageShow ? (
                                                <img className="w-full h-full object-contain rounded-md" src={imageShow} alt="Category Preview" />
                                            ) : (
                                                <div className="text-center p-4">
                                                     <span className="text-gray-500 mx-auto inline-block"><FaImage size={40} /></span>
                                                     <p className="mt-2 text-sm text-gray-400">Click to browse or drag & drop</p>
                                                     <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (Max 2MB)</p>
                                                </div>
                                            )}
                                        </label>
                                        <input onChange={imageHandle} className="hidden" type="file" accept="image/png, image/jpeg, image/webp, image/gif" name="image" id="image_cat_input" />
                                        {imageShow && ( <button type="button" onClick={() => { setImage(''); setState(s => ({...s, image: ''})); const fileInput = document.getElementById('image_cat_input'); if (fileInput) fileInput.value = null; }} className="text-xs text-rose-400 hover:text-rose-300 mt-2 underline"> Remove image </button> )}
                                    </div>

                                     {/* Submit Button */}
                                    <div className="mt-2">
                                        <button type="submit" disabled={loader} className={`w-full flex justify-center items-center bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 text-sm sm:text-base ${ loader ? 'opacity-70 cursor-not-allowed from-gray-500 to-gray-600' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30' }`}>
                                            {loader ? ( <PropagateLoader color="#ffffff" cssOverride={overrideStyle} size={10}/> ) : isEdit ? ( 'Update Category' ) : ( 'Add Category' )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx>{`
                .wave-bg { background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e); background-size: 400%; animation: waveAnimation 20s ease-in-out infinite; }
                @keyframes waveAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .particles { background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: particleMove 30s linear infinite; }
                @keyframes particleMove { from { background-position: 0 0, 25px 25px; } to { background-position: 300px 300px, 325px 325px; } }
                 /* Ensure sticky positioning works */
                 @media (min-width: 1024px) {
                    .lg\\:sticky { position: sticky; }
                    .lg\\:top-8 { top: 2rem; }
                 }
                 /* Optional: Style SweetAlert2 for dark mode */
                 .swal2-popup {
                    background-color: #252A40 !important; /* Match card background */
                    color: #e5e7eb !important; /* Light gray text */
                 }
                 .swal2-title {
                    color: #f9fafb !important; /* White title */
                 }
                 .swal2-confirm-button, .swal2-cancel-button {
                     border-radius: 0.5rem !important; /* Match button border radius */
                 }

            `}</style>
        </div>
    );
};

export default Category;