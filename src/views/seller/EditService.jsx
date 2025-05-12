import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { get_serviceCategory } from '../../store/Reducers/serviceCategoryReducer';
import { get_service, update_service, messageClear, clearSingleService } from '../../store/Reducers/serviceReducer';
import { FaImages, FaChevronDown, FaSpinner, FaXmark, FaPen, FaList } from "react-icons/fa6";
import toast from 'react-hot-toast';

// Placeholder image
const defaultServiceImage = '/images/service_placeholder.png'; // Ensure this path matches your setup

const EditService = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // State Selectors
    const { serviceCategories = [], loader: categoryLoader } = useSelector(state => state.serviceCategory);
    const { loader: serviceLoader, successMessage, errorMessage, service } = useSelector(state => state.service);
    const { userInfo } = useSelector(state => state.auth);

    // Form State
    const [state, setState] = useState({
        name: '',
        description: '',
        price: '',
        phoneNumber: '',
        province: '',
        municipality: ''
        // Removed shopName since it's not editable in the form
    });

    // Category State
    const [cateShow, setCateShow] = useState(false);
    const [category, setCategory] = useState('');
    const [allCategory, setAllCategory] = useState([]);
    const [searchValue, setSearchValue] = useState('');

    // Location State
    const [locations, setLocations] = useState([]);
    const [municipalitiesList, setMunicipalitiesList] = useState([]);
    const [provinceShow, setProvinceShow] = useState(false);
    const [municipalityShow, setMunicipalityShow] = useState(false);
    const [searchProvinceValue, setSearchProvinceValue] = useState('');

    // Phone Validation State
    const [phoneError, setPhoneError] = useState('');

    // Fetch Locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/locations');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setLocations(Array.isArray(data.provinces) ? data.provinces : []);
            } catch (error) {
                console.error('Error fetching locations:', error);
                toast.error('Failed to load locations', {
                    style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
                });
            }
        };
        fetchLocations();
    }, []);

    // Fetch Categories and Service Data
    useEffect(() => {
        dispatch(get_serviceCategory({ searchValue: '', parPage: '', page: "" }));
        if (serviceId) {
            dispatch(get_service(serviceId));
        }
        return () => {
            dispatch(clearSingleService());
        };
    }, [dispatch, serviceId]);

    // Update local category list
    useEffect(() => {
        setAllCategory(serviceCategories || []);
    }, [serviceCategories]);

    // Populate Form
    useEffect(() => {
        if (service) {
            setState({
                name: service.name || '',
                description: service.description || '',
                price: service.price ? String(service.price) : '', // Ensure price is a string
                phoneNumber: service.phoneNumber || '',
                province: service.province || '',
                municipality: service.municipality || ''
            });
            setCategory(service.category || '');
            const selectedProvinceData = locations.find(p => p.name === service.province);
            setMunicipalitiesList(Array.isArray(selectedProvinceData?.municipalities) ? selectedProvinceData.municipalities : []);
            setPhoneError('');
        }
    }, [service, locations]);

    // Input Handler
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
        } else if (name === 'price') {
            processedValue = value.replace(/[^0-9.]/g, '');
            if (processedValue && parseFloat(processedValue) < 0) processedValue = '0';
        }

        setState(prevState => ({ ...prevState, [name]: processedValue }));
        if (name === 'phoneNumber') setPhoneError(error);
        if (name === 'province') {
            const selectedProvinceData = locations.find(p => p.name === value);
            const newMunicipalities = Array.isArray(selectedProvinceData?.municipalities) ? selectedProvinceData.municipalities : [];
            setMunicipalitiesList(newMunicipalities);
            setState(prevState => ({ ...prevState, municipality: '' }));
        }
    };

    // Category Search Handler
    const categorySearch = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        const sourceCategories = serviceCategories || [];
        const filtered = sourceCategories.filter(c =>
            c.name.toLowerCase().includes(value.toLowerCase())
        );
        setAllCategory(filtered);
    };

    // Province Search Handler
    const provinceSearch = (e) => {
        setSearchProvinceValue(e.target.value);
    };

    // Handle Update Submission
    const handleUpdate = (e) => {
        e.preventDefault();

        // Log state for debugging
        console.log('Form State:', state, 'Category:', category);

        // Validation
        const finalPhoneCheck = /^\+213[567]\d{8}$/;
        if (phoneError || !finalPhoneCheck.test(state.phoneNumber)) {
            toast.error('Fix Phone Number.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        if (!category) {
            toast.error('Select Category.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        if (!state.province) {
            toast.error('Select Province.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        if (!state.municipality) {
            toast.error('Select Municipality.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        if (!state.name.trim()) {
            toast.error('Service Name is required.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        if (!state.description.trim()) {
            toast.error('Description is required.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }
        const priceNum = parseFloat(state.price);
        if (!state.price || isNaN(priceNum) || priceNum <= 0) {
            toast.error('Valid Price is required.', {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            return;
        }

        const serviceData = {
            name: state.name.trim(),
            description: state.description.trim(),
            price: priceNum,
            phoneNumber: state.phoneNumber,
            province: state.province,
            municipality: state.municipality,
            category,
            shopName: userInfo?.shopInfo?.shopName || service?.shopName || 'EasyShop' // Set shopName explicitly
        };
        dispatch(update_service({ serviceId, serviceData }));
    };

    // Handle Success/Error Messages & Redirect
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage, {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #00e5ff' }
            });
            dispatch(messageClear());
            navigate('/seller/dashboard/services');
        }
        if (errorMessage) {
            toast.error(errorMessage, {
                style: { background: '#252A40', color: '#e5e7eb', border: '1px solid #f87171' }
            });
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch, navigate]);

    // Loading State
    if (serviceLoader && !service) {
        return (
            <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex justify-center items-center'>
                <div className="flex flex-col items-center gap-3">
                    <FaSpinner className="animate-spin text-cyan-500 text-5xl" />
                    <span className='text-gray-300'>Loading Service Details...</span>
                </div>
            </div>
        );
    }

    // Service Not Found State
    if (!serviceLoader && !service && serviceId) {
        return (
            <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] flex flex-col justify-center items-center'>
                <p className='text-xl text-rose-400 mb-4'>{errorMessage || "Service not found or could not be loaded."}</p>
                <Link to="/seller/dashboard/services" className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                    <FaList size={12} /> Back to Services
                </Link>
            </div>
        );
    }

    // Image Error Handler
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = defaultServiceImage;
    };

    // Filtered Provinces
    const filteredProvinces = searchProvinceValue
        ? locations.filter(p => p.name.toLowerCase().includes(searchProvinceValue.toLowerCase()))
        : locations;

    return (
        <div className='px-4 md:px-7 py-8 min-h-screen bg-gradient-to-br from-[#111827] to-[#1a1a2e] text-gray-300 relative overflow-hidden'>
            {/* Backgrounds */}
            <div className="absolute inset-0 wave-bg opacity-10 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className='flex flex-wrap justify-between items-center gap-4 mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight'>Edit Service</h1>
                    <Link to='/seller/dashboard/services' className='bg-[#303650]/80 hover:bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold rounded-lg px-4 py-2 text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2'>
                        <FaList size={12} /> All Services
                    </Link>
                </div>

                <div className='w-full p-5 md:p-8 bg-[#252A40]/70 backdrop-blur-md rounded-xl border border-gray-700/80 shadow-lg'>
                    <form onSubmit={handleUpdate}>
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
                                    placeholder='e.g., Deep Cleaning (3 hours)'
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

                        {/* Province & Municipality Dropdowns */}
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
                                            onChange={provinceSearch}
                                            className='w-full px-3 py-2 focus:border-cyan-500 outline-none bg-[#1e2337]/70 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm'
                                            type="text"
                                            placeholder='Search province...'
                                        />
                                    </div>
                                    <div className='max-h-[250px] overflow-y-auto custom-scrollbar p-2'>
                                        {locations.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">Loading provinces...</div>
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
                                            if (state.province && municipalitiesList.length > 0) setMunicipalityShow(prev => !prev);
                                            setProvinceShow(false);
                                            setCateShow(false);
                                        }}
                                        className={`w-full cursor-pointer px-4 py-2.5 border rounded-lg outline-none text-sm bg-[#303650]/80 border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-gray-200 placeholder:text-gray-400 ${(!state.province || municipalitiesList.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={state.municipality}
                                        type="text"
                                        placeholder={!state.province ? '-- Select Province First --' : '-- Select Municipality --'}
                                        required
                                        disabled={!state.province || municipalitiesList.length === 0}
                                        aria-haspopup="listbox"
                                        aria-expanded={municipalityShow}
                                    />
                                    <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 pointer-events-none ${municipalityShow ? 'rotate-180' : ''}`} />
                                </div>
                                <div className={`absolute top-full left-0 right-0 mt-1 z-30 bg-[#2a2e4a] border border-cyan-500/40 shadow-lg w-full rounded-lg transition-all duration-300 origin-top overflow-hidden ${municipalityShow ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'}`} role="listbox" aria-labelledby="municipality-input">
                                    <div className='max-h-[250px] overflow-y-auto custom-scrollbar p-2'>
                                        {municipalitiesList.length > 0 ? (
                                            municipalitiesList.map((m) => (
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
                                {state.province && municipalitiesList.length === 0 && <p className="text-xs text-amber-400 mt-1.5">No municipalities found.</p>}
                            </div>
                        </div>

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
                                            value={searchValue}
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
                                                        setSearchValue('');
                                                        setAllCategory(serviceCategories || []);
                                                    }}
                                                    role="option"
                                                    aria-selected={category === c.name}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setCateShow(false);
                                                            setCategory(c.name);
                                                            setSearchValue('');
                                                            setAllCategory(serviceCategories || []);
                                                        }
                                                    }}
                                                >
                                                    {c.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500 italic">No categories {searchValue ? `matching "${searchValue}"` : 'found'}.</div>
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

                        {/* Description */}
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

                        {/* Current Images Display */}
                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>Current Images</label>
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                                {Array.isArray(service?.images) && service.images.length > 0 ? (
                                    service.images.map((img, i) => (
                                        <div key={i} className='h-[120px] relative group border-2 border-gray-600/60 rounded-lg overflow-hidden shadow-sm bg-[#303650]/30'>
                                            <img
                                                className='w-full h-full object-cover'
                                                src={img || defaultServiceImage}
                                                alt={`Service Image ${i + 1}`}
                                                title={`Image ${i + 1}`}
                                                onError={handleImageError}
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center opacity-100 transition-opacity duration-300">
                                                <span className="text-xs text-gray-400 italic">Editing unavailable</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-6 text-gray-500 italic">No images currently uploaded.</div>
                                )}
                            </div>
                            <p className='text-xs text-amber-400 mt-2'>Note: Image editing is currently unavailable. To change images, please delete and re-add the service.</p>
                        </div>

                        {/* Submit Button */}
                        <div className='flex justify-end mt-8 pt-6 border-t border-gray-700/50'>
                            <button
                                type="submit"
                                disabled={serviceLoader || !!phoneError}
                                className={`w-full sm:w-auto bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-300 shadow-md text-base flex items-center justify-center gap-2 ${(serviceLoader || !!phoneError) ? 'opacity-60 cursor-not-allowed from-gray-600 to-gray-700' : 'hover:from-cyan-600 hover:to-purple-700 hover:shadow-lg hover:shadow-cyan-500/30'}`}
                            >
                                {serviceLoader ? <FaSpinner className="animate-spin" /> : <FaPen />}
                                <span className="ml-1">{serviceLoader ? 'Processing...' : 'Update Service'}</span>
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
            `}</style>
        </div>
    );
};

export default EditService;