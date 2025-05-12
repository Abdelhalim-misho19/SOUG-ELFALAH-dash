import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaImages, FaList, FaChevronDown, FaXmark, FaSpinner, FaPlus, FaPen } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import { get_serviceCategory } from '../../store/Reducers/serviceCategoryReducer';
import { add_service, messageClear } from '../../store/Reducers/serviceReducer';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';
import api from '../../api/api';

// Placeholder image
const defaultServiceImage = '/images/service_placeholder.png'; // Adjust path as needed

const AddService = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { serviceCategories = [], loader: categoryLoader } = useSelector(state => state.serviceCategory);
    const { loader: serviceLoader, successMessage, errorMessage } = useSelector(state => state.service);
    const { userInfo } = useSelector(state => state.auth);
    const fileInputRef = useRef(null);
    const imageChangeRefs = useRef([]);

    // Form state
    const [state, setState] = useState({ name: "", description: "", price: "", phoneNumber: "", province: "", municipality: "" });
    // UI state for Category Dropdown
    const [cateShow, setCateShow] = useState(false);
    const [category, setCategory] = useState('');
    const [allCategory, setAllCategory] = useState([]);
    const [searchCategoryValue, setSearchCategoryValue] = useState('');
    // Image State
    const [images, setImages] = useState([]);
    const [imageShow, setImageShow] = useState([]);
    // Location State
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);
    // Dropdown states
    const [provinceShow, setProvinceShow] = useState(false);
    const [municipalityShow, setMunicipalityShow] = useState(false);
    const [searchProvinceValue, setSearchProvinceValue] = useState('');
    // Validation State
    const [phoneError, setPhoneError] = useState('');

    // Fetch Initial Data
    useEffect(() => {
        dispatch(get_serviceCategory({ searchValue: '', parPage: '', page: "" }));
        const fetchLocations = async () => {
            setIsLoadingLocations(true);
            try {
                const { data } = await api.get('/locations');
                setLocations(Array.isArray(data.provinces) ? data.provinces : []);
            } catch (error) {
                console.error('Error fetching locations:', error);
                toast.error('Failed to load locations.', { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
                setLocations([]);
            } finally {
                setIsLoadingLocations(false);
            }
        };
        fetchLocations();
    }, [dispatch]);

    // Update Local Category List
    useEffect(() => {
        setAllCategory(serviceCategories || []);
    }, [serviceCategories]);

    // Reset Form Function
    const resetForm = useCallback(() => {
        setState({ name: "", description: "", price: "", phoneNumber: "", province: "", municipality: "" });
        setCategory('');
        setSearchCategoryValue('');
        setAllCategory(serviceCategories || []);
        imageShow.forEach(img => { if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
        setImageShow([]);
        setImages([]);
        setPhoneError('');
        if (fileInputRef.current) fileInputRef.current.value = null;
        imageChangeRefs.current.forEach(ref => { if (ref) ref.value = null; });
        setCateShow(false);
        setProvinceShow(false);
        setMunicipalityShow(false);
        setSearchProvinceValue('');
    }, [serviceCategories, imageShow]);

    // Handle Messages & Reset
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #00e5ff' } });
            resetForm();
            dispatch(messageClear());
            navigate('/seller/dashboard/services');
        }
        if (errorMessage) {
            toast.error(errorMessage, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, resetForm, navigate]);

    // Input Handling & Validation
    const inputHandle = (e) => {
        const { name, value } = e.target;
        let error = '';
        let processedValue = value;
        if (name === 'phoneNumber') {
            const phoneRegex = /^\+213[567]\d{8}$/;
            if (value && !phoneRegex.test(value)) {
                if (!value.startsWith('+213')) error = 'Start with +213.';
                else if (value.length !== 13) error = 'Must be 13 digits.';
                else error = 'Invalid format.';
            }
        } else if (['price'].includes(name)) {
            processedValue = value.replace(/[^0-9.]/g, '');
            if (parseFloat(processedValue) < 0) processedValue = '0';
        }
        setState(prevState => ({ ...prevState, [name]: processedValue }));
        if (name === 'phoneNumber') setPhoneError(error);
        if (name === 'province') setState(prevState => ({ ...prevState, municipality: "" }));
    };

    // Category Search
    const categorySearch = (e) => {
        const value = e.target.value;
        setSearchCategoryValue(value);
        const sourceCategories = serviceCategories || [];
        const filtered = sourceCategories.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        setAllCategory(filtered);
    };

    // Image Handling
    const MAX_IMAGES = 5;
    const MAX_SIZE_MB = 3;
    const imageHandle = (e) => {
        const files = Array.from(e.target.files);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        let currentImageCount = images.length;
        let addedCount = 0;
        const newImagesFiles = [];
        const newImageUrls = [];
        for (const file of files) {
            if (currentImageCount + addedCount >= MAX_IMAGES) {
                toast.error(`Max ${MAX_IMAGES} images.`, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
                break;
            }
            if (!allowedTypes.includes(file.type)) {
                toast.error(`File ${file.name}: Invalid type.`, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
                continue;
            }
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error(`File ${file.name} exceeds ${MAX_SIZE_MB}MB.`, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
                continue;
            }
            newImagesFiles.push(file);
            newImageUrls.push({ url: URL.createObjectURL(file), name: file.name });
            addedCount++;
        }
        if (newImagesFiles.length > 0) {
            setImages(prev => [...prev, ...newImagesFiles]);
            setImageShow(prev => [...prev, ...newImageUrls]);
        }
        if (fileInputRef.current) fileInputRef.current.value = null;
    };
    const changeImage = (file, index) => {
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid type.', { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Exceeds ${MAX_SIZE_MB}MB.`, { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        const tempImages = [...images];
        const tempUrl = [...imageShow];
        if (tempUrl[index]?.url?.startsWith('blob:')) {
            URL.revokeObjectURL(tempUrl[index].url);
        }
        tempImages[index] = file;
        tempUrl[index] = { url: URL.createObjectURL(file), name: file.name };
        setImages(tempImages);
        setImageShow(tempUrl);
        if (imageChangeRefs.current[index]) imageChangeRefs.current[index].value = null;
    };
    const removeImage = (index) => {
        if (imageShow[index]?.url?.startsWith('blob:')) {
            URL.revokeObjectURL(imageShow[index].url);
        }
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageShow(prev => prev.filter((_, i) => i !== index));
    };
    useEffect(() => {
        const urls = imageShow.map(img => img.url);
        return () => {
            urls.forEach(url => {
                if (url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
        };
    }, [imageShow]);

    // Form Submission
    const handleAddService = (e) => {
        e.preventDefault();
        const finalPhoneCheck = /^\+213[567]\d{8}$/;
        if (phoneError || !finalPhoneCheck.test(state.phoneNumber)) {
            toast.error('Fix Phone Number.', { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (!category) {
            toast.error("Select Category.", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (!state.province) {
            toast.error("Select Province.", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (!state.municipality) {
            toast.error("Select Municipality.", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (images.length === 0) {
            toast.error("Upload at least one Image.", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        if (!state.name.trim() || !state.description.trim() || !state.price) {
            toast.error("Fill all required fields (*).", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        const priceNum = parseFloat(state.price);
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Valid Price is required.", { style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' } });
            return;
        }
        const formData = new FormData();
        Object.entries(state).forEach(([key, value]) => {
            formData.append(key, typeof value === 'string' ? value.trim() : value);
        });
        formData.append('category', category);
        formData.append('shopName', userInfo?.shopInfo?.shopName || userInfo?.name || 'Default Service Provider');
        images.forEach(imgFile => {
            formData.append('images', imgFile);
        });
        dispatch(add_service(formData));
    };

    // Memoize Municipalities
    const currentMunicipalities = useMemo(() => {
        if (!state.province || !Array.isArray(locations) || locations.length === 0) return [];
        const selectedProvince = locations.find(p => p.name === state.province);
        return Array.isArray(selectedProvince?.municipalities) ? selectedProvince.municipalities : [];
    }, [state.province, locations]);

    // Memoize Filtered Provinces
    const filteredProvinces = useMemo(() => {
        if (!searchProvinceValue) return locations || [];
        return (locations || []).filter(p => p.name.toLowerCase().includes(searchProvinceValue.toLowerCase()));
    }, [searchProvinceValue, locations]);

    // Image Error Handler
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = defaultServiceImage;
    };

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Add New Service</h1>
                    <Link to='/seller/dashboard/services' className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                        <FaList size={12} /> All Services
                    </Link>
                </div>

                <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <form onSubmit={handleAddService}>
                        {/* Form Fields */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            <div>
                                <label htmlFor="name" className='block text-sm font-medium text-gray-300 mb-1.5'>Service Name <span className="text-rose-500">*</span></label>
                                <input
                                    className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400'
                                    onChange={inputHandle}
                                    value={state.name}
                                    type="text"
                                    name='name'
                                    id='name'
                                    placeholder=' goods transportation'
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className='block text-sm font-medium text-gray-300 mb-1.5'>Contact Phone <span className="text-rose-500">*</span></label>
                                <input
                                    className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:ring-1 text-gray-200 placeholder-gray-400 ${phoneError ? 'border-rose-500 ring-rose-500/50 focus:border-rose-500 focus:ring-rose-500/50' : 'focus:border-cyan-500 focus:ring-cyan-500/50'}`}
                                    onChange={inputHandle}
                                    value={state.phoneNumber}
                                    type="tel"
                                    name='phoneNumber'
                                    id='phoneNumber'
                                    placeholder='+213xxxxxxxxx'
                                    required
                                />
                                {phoneError && <span className='text-rose-400 text-xs mt-1'>{phoneError}</span>}
                            </div>
                        </div>

                        {/* Custom Province & Municipality Dropdowns */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            <div className='relative'>
                                <label htmlFor="province-input" className='block text-sm font-medium text-gray-300 mb-1.5'>Province <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        id="province-input"
                                        readOnly
                                        onClick={() => {
                                            setProvinceShow(prev => !prev);
                                            setMunicipalityShow(false);
                                            setCateShow(false);
                                        }}
                                        className='w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400'
                                        value={state.province}
                                        type="text"
                                        placeholder='-- Select Province --'
                                        required
                                        aria-haspopup="listbox"
                                        aria-expanded={provinceShow}
                                    />
                                    <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${provinceShow ? 'rotate-180' : ''}`} />
                                </div>
                                <div className={`absolute top-full left-0 right-0 mt-1 z-30 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${provinceShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`} role="listbox" aria-labelledby="province-input">
                                    <div className='p-2 border-b border-gray-700/50'>
                                        <input
                                            value={searchProvinceValue}
                                            onChange={(e) => setSearchProvinceValue(e.target.value)}
                                            className='w-full px-3 py-2 focus:border-cyan-500 outline-none bg-[#1e2337]/70 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm'
                                            type="text"
                                            placeholder='Search province...'
                                        />
                                    </div>
                                    <div className='max-h-[250px] overflow-y-auto custom-scrollbar p-2'>
                                        {isLoadingLocations ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                                        ) : filteredProvinces.length > 0 ? (
                                            filteredProvinces.map((p) => (
                                                <div
                                                    key={p.name}
                                                    className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-200 ${state.province === p.name ? 'bg-cyan-500/30 text-cyan-100 font-semibold' : 'hover:bg-[#374151]/60 text-gray-300'}`}
                                                    onClick={() => {
                                                        setState(prev => ({ ...prev, province: p.name, municipality: '' }));
                                                        setProvinceShow(false);
                                                        setSearchProvinceValue('');
                                                    }}
                                                    role="option"
                                                    aria-selected={state.province === p.name}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setState(prev => ({ ...prev, province: p.name, municipality: '' }));
                                                            setProvinceShow(false);
                                                            setSearchProvinceValue('');
                                                        }
                                                    }}
                                                >
                                                    {p.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500 italic">No provinces found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className='relative'>
                                <label htmlFor="municipality-input" className='block text-sm font-medium text-gray-300 mb-1.5'>Municipality <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        id="municipality-input"
                                        readOnly
                                        onClick={() => {
                                            if (state.province && currentMunicipalities.length > 0) setMunicipalityShow(prev => !prev);
                                            setProvinceShow(false);
                                            setCateShow(false);
                                        }}
                                        className={`w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400 ${(!state.province || currentMunicipalities.length === 0 || isLoadingLocations) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={state.municipality}
                                        type="text"
                                        placeholder={!state.province ? '-- Select Province First --' : '-- Select Municipality --'}
                                        required
                                        disabled={!state.province || currentMunicipalities.length === 0 || isLoadingLocations}
                                        aria-haspopup="listbox"
                                        aria-expanded={municipalityShow}
                                    />
                                    <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${municipalityShow ? 'rotate-180' : ''}`} />
                                </div>
                                <div className={`absolute top-full left-0 right-0 mt-1 z-30 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${municipalityShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`} role="listbox" aria-labelledby="municipality-input">
                                    <div className='max-h-[250px] overflow-y-auto custom-scrollbar p-2'>
                                        {currentMunicipalities?.length > 0 ? (
                                            currentMunicipalities.map((m) => (
                                                <div
                                                    key={m}
                                                    className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-200 ${state.municipality === m ? 'bg-cyan-500/30 text-cyan-100 font-semibold' : 'hover:bg-[#374151]/60 text-gray-300'}`}
                                                    onClick={() => {
                                                        setState(prev => ({ ...prev, municipality: m }));
                                                        setMunicipalityShow(false);
                                                    }}
                                                    role="option"
                                                    aria-selected={state.municipality === m}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setState(prev => ({ ...prev, municipality: m }));
                                                            setMunicipalityShow(false);
                                                        }
                                                    }}
                                                >
                                                    {m}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500 italic">Select province or none found.</div>
                                        )}
                                    </div>
                                </div>
                                {!state.province && <p className="text-xs text-gray-500 mt-1.5">Select province first.</p>}
                                {state.province && isLoadingLocations && <p className="text-xs text-gray-500 mt-1.5">Loading municipalities...</p>}
                                {state.province && currentMunicipalities.length === 0 && !isLoadingLocations && <p className="text-xs text-amber-400 mt-1.5">No municipalities found.</p>}
                            </div>
                        </div>
                        {/* End Custom Dropdowns */}

                        {/* Category & Price Row */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            <div className='relative'>
                                <label htmlFor="category-input" className='block text-sm font-medium text-gray-300 mb-1.5'>Category <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        id="category-input"
                                        readOnly
                                        onClick={() => {
                                            setCateShow(prev => !prev);
                                            setProvinceShow(false);
                                            setMunicipalityShow(false);
                                        }}
                                        className='w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400'
                                        value={category}
                                        type="text"
                                        placeholder='-- Select Category --'
                                        required
                                        aria-haspopup="listbox"
                                        aria-expanded={cateShow}
                                    />
                                    <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${cateShow ? 'rotate-180' : ''}`} />
                                </div>
                                <div className={`absolute top-full left-0 right-0 mt-1 z-30 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${cateShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`} role="listbox" aria-labelledby="category-input">
                                    <div className='p-2'>
                                        <input
                                            value={searchCategoryValue}
                                            onChange={categorySearch}
                                            className='w-full px-3 py-2 focus:border-cyan-500 outline-none bg-[#1e2337]/70 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm'
                                            type="text"
                                            placeholder='Search category...'
                                            aria-controls="category-listbox"
                                        />
                                    </div>
                                    <div id="category-listbox" className='max-h-[200px] overflow-y-auto custom-scrollbar p-2'>
                                        {categoryLoader ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">Loading categories...</div>
                                        ) : Array.isArray(allCategory) && allCategory.length > 0 ? (
                                            allCategory.map((c, i) => (
                                                <div
                                                    key={c._id || i}
                                                    className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-200 ${category === c.name ? 'bg-cyan-500/30 text-cyan-100 font-semibold' : 'hover:bg-[#374151]/60 text-gray-300'}`}
                                                    onClick={() => {
                                                        setCateShow(false);
                                                        setCategory(c.name);
                                                        setSearchCategoryValue('');
                                                        setAllCategory(serviceCategories || []);
                                                    }}
                                                    role="option"
                                                    aria-selected={category === c.name}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setCateShow(false);
                                                            setCategory(c.name);
                                                            setSearchCategoryValue('');
                                                            setAllCategory(serviceCategories || []);
                                                        }
                                                    }}
                                                >
                                                    {c.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500 italic">No categories {searchCategoryValue ? `matching "${searchCategoryValue}"` : 'found'}.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="price" className='block text-sm font-medium text-gray-300 mb-1.5'>Price (DZD) <span className="text-rose-500">*</span></label>
                                <input
                                    className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400'
                                    onChange={inputHandle}
                                    value={state.price}
                                    type="number"
                                    min="0"
                                    step="any"
                                    name='price'
                                    id='price'
                                    placeholder='e.g., 5000.00'
                                    required
                                />
                            </div>
                        </div>

                        <div className='mb-6'>
                            <label htmlFor="description" className='block text-sm font-medium text-gray-300 mb-1.5'>Description <span className="text-rose-500">*</span></label>
                            <textarea
                                rows={5}
                                className='w-full px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder-gray-400 resize-none custom-scrollbar'
                                onChange={inputHandle}
                                value={state.description}
                                name='description'
                                id='description'
                                placeholder='Detailed description of the service offered...'
                                required
                            ></textarea>
                        </div>

                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>Service Images (Up to {MAX_IMAGES}) <span className="text-rose-500">*</span></label>
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                                {imageShow.map((img, i) => (
                                    <div key={i} className='h-[120px] relative group border-2 border-gray-600/60 rounded-lg overflow-hidden shadow-sm bg-[#303650]/30'>
                                        <input
                                            onChange={(e) => changeImage(e.target.files[0], i)}
                                            type="file"
                                            id={`change-image-${i}`}
                                            className='hidden'
                                            accept="image/*"
                                            ref={el => imageChangeRefs.current[i] = el}
                                        />
                                        <img
                                            className='w-full h-full object-cover'
                                            src={img.url}
                                            alt={`Preview ${i + 1}`}
                                            title={img.name}
                                            onError={handleImageError}
                                        />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <label htmlFor={`change-image-${i}`} className="cursor-pointer p-1.5 mb-1 bg-sky-500/80 hover:bg-sky-600 text-white rounded-full text-xs leading-none transition-colors duration-200" aria-label={`Change image ${i + 1}`}>
                                                <FaPen size={10} />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className='p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full text-xs leading-none transition-colors duration-200'
                                                aria-label={`Remove image ${i + 1}`}
                                            >
                                                <FaXmark size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {images.length < MAX_IMAGES && (
                                    <label className='flex justify-center items-center flex-col h-[120px] cursor-pointer border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors duration-300 w-full bg-[#303650]/40 hover:bg-[#303650]/60' htmlFor="image_upload_input">
                                        <FaImages className="text-3xl mb-1" />
                                        <span className="text-xs font-semibold">Add Image</span>
                                        <span className="text-[10px]">({images.length}/{MAX_IMAGES})</span>
                                    </label>
                                )}
                                <input
                                    ref={fileInputRef}
                                    className='hidden'
                                    onChange={imageHandle}
                                    multiple
                                    type="file"
                                    id='image_upload_input'
                                    accept="image/*"
                                />
                            </div>
                            {images.length === 0 && <p className="text-xs text-amber-400 mt-2">At least one image is required.</p>}
                        </div>

                        <div className='flex justify-end mt-8 pt-6 border-t border-gray-700/50'>
                            <button
                                type="submit"
                                disabled={serviceLoader || !!phoneError}
                                className={`w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-300 shadow-md text-base flex items-center justify-center gap-2 ${ (serviceLoader || !!phoneError) ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30' }`}
                            >
                                {serviceLoader ? <BeatLoader color="#ffffff" size={10} /> : <FaPlus />}
                                <span className="ml-1">{serviceLoader ? 'Processing...' : 'Add Service'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                /* Wave Background & Particles */
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
                .particles {
                    background-image: radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 1px);
                    background-size: 30px 30px, 50px 50px;
                    background-position: 0 0, 25px 25px;
                    animation: particleMove 30s linear infinite;
                }
                @keyframes particleMove {
                    from { background-position: 0 0, 25px 25px; }
                    to { background-position: 300px 300px, 325px 325px; }
                }
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(30, 35, 55, 0.4);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.7);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(107, 114, 128, 0.9);
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(75, 85, 99, 0.7) rgba(30, 35, 55, 0.4);
                }
                /* Remove Number Input Spinners */
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
                /* Select dropdown styling */
                select option {
                    background-color: #252A40;
                    color: #e5e7eb;
                }
            `}</style>
        </div>
    );
};

export default AddService;