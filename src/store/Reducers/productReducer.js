import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api"; // Ensure this path is correct

export const add_product = createAsyncThunk(
    'product/add_product',
    async(product,{rejectWithValue, fulfillWithValue}) => {
        try {
            // Assuming 'product' is FormData here
            const {data} = await api.post('/product-add',product,{withCredentials: true})
            return fulfillWithValue(data)
        } catch (error) {
            console.error("Error adding product:", error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to add product' });
        }
    }
)
// End Method

export const get_products = createAsyncThunk(
    'product/get_products',
    async({ parPage,page,searchValue },{rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.get(`/products-get?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`,{withCredentials: true})
            // console.log(data) // Keep for debugging if needed
            return fulfillWithValue(data)
        } catch (error) {
             console.error("Error getting products:", error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch products' });
        }
    }
)
// End Method

export const get_product = createAsyncThunk(
    'product/get_product',
    async( productId ,{rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.get(`/product-get/${productId}`,{withCredentials: true})
            // console.log(data) // Keep for debugging if needed
            return fulfillWithValue(data)
        } catch (error) {
            console.error(`Error getting product ${productId}:`, error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to fetch product details' });
        }
    }
)
// End Method

export const update_product = createAsyncThunk(
    'product/update_product',
    async( product ,{rejectWithValue, fulfillWithValue}) => { // product likely contains { productId, formData }
        try {
             // Adjust endpoint if needed, maybe PUT or PATCH and include ID in URL?
             // Example: await api.put(`/product-update/${product.productId}`, product.formData, ...)
            const {data} = await api.post('/product-update', product,{withCredentials: true}) // Assuming API handles ID within 'product' object
            // console.log(data)
            return fulfillWithValue(data)
        } catch (error) {
            console.error("Error updating product:", error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to update product' });
        }
    }
)
// End Method

export const product_image_update = createAsyncThunk(
    'product/product_image_update',
    async( {oldImage,newImage,productId} ,{rejectWithValue, fulfillWithValue}) => {
        try {
            const formData = new FormData()
            formData.append('oldImage', oldImage) // Ensure backend uses these names
            formData.append('newImage', newImage)
            formData.append('productId', productId)
            const {data} = await api.post('/product-image-update', formData,{withCredentials: true})
            // console.log(data)
            return fulfillWithValue(data)
        } catch (error) {
             console.error("Error updating product image:", error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to update product image' });
        }
    }
)
// End Method

// +++ START: Add delete_product Thunk +++
export const delete_product = createAsyncThunk(
    'product/delete_product',
    async (productId, { rejectWithValue, fulfillWithValue }) => {
        try {
            // Use DELETE method and include ID in URL
            const { data } = await api.delete(`/product-delete/${productId}`, { withCredentials: true });
            console.log('Delete product response:', data);
            // Ensure backend sends back productId on success for potential filtering
            return fulfillWithValue({ ...data, productId }); // Pass productId along
        } catch (error) {
            console.error("Error deleting product:", error.response?.data);
            return rejectWithValue(error.response?.data || { error: 'Failed to delete product' });
        }
    }
);
// +++ END: Add delete_product Thunk +++


export const productReducer = createSlice({
    name: 'product',
    initialState:{
        successMessage :  '',
        errorMessage : '',
        loader: false, // General loader for list fetching
        products : [],
        product : null, // Initialize single product as null
        totalProduct: 0,
        // loadingAction: false, // Optional: Specific loader for add/update/delete
    },
    reducers : {
        messageClear : (state,_) => {
            state.errorMessage = "";
            state.successMessage = ""; // Clear both messages
        },
        // Optional: Add reducer to clear single product state if needed
        // clearCurrentProduct: (state) => {
        //     state.product = null;
        // }
    },
    extraReducers: (builder) => {
        builder
        .addCase(add_product.pending, (state) => {
            state.loader = true; // Or loadingAction = true
            state.errorMessage = "";
            state.successMessage = "";
        })
        .addCase(add_product.rejected, (state, { payload }) => {
            state.loader = false; // Or loadingAction = false
            state.errorMessage = payload?.error || payload?.message || 'Failed to add product';
        })
        .addCase(add_product.fulfilled, (state, { payload }) => {
            state.loader = false; // Or loadingAction = false
            state.successMessage = payload.message;
            // Prepend new product for immediate UI update (optional)
            // state.products = [payload.product, ...state.products];
            // state.totalProduct = state.totalProduct + 1;
        })

        .addCase(get_products.pending, (state) => {
            state.loader = true;
        })
        .addCase(get_products.fulfilled, (state, { payload }) => {
            state.loader = false;
            state.totalProduct = payload.totalProduct;
            state.products = payload.products;
        })
        .addCase(get_products.rejected, (state, { payload }) => {
            state.loader = false;
            state.errorMessage = payload?.error || payload?.message || 'Failed to load products';
            state.products = [];
            state.totalProduct = 0;
        })

        .addCase(get_product.pending, (state) => { // Added pending for get_product
            state.product = null; // Clear previous product while loading new one
            // state.loader = true; // You might want a specific loader here
        })
        .addCase(get_product.fulfilled, (state, { payload }) => {
            state.product = payload.product;
            // state.loader = false;
        })
         .addCase(get_product.rejected, (state, { payload }) => { // Added rejected for get_product
            // state.loader = false;
             state.errorMessage = payload?.error || payload?.message || 'Failed to load product details';
         })

        .addCase(update_product.pending, (state) => {
            state.loader = true; // Or loadingAction = true
            state.errorMessage = "";
            state.successMessage = "";
        })
        .addCase(update_product.rejected, (state, { payload }) => {
            state.loader = false; // Or loadingAction = false
            state.errorMessage = payload?.error || payload?.message || 'Failed to update product';
        })
        .addCase(update_product.fulfilled, (state, { payload }) => {
            state.loader = false; // Or loadingAction = false
            state.product = payload.product; // Update the single product state
            state.successMessage = payload.message;
            // Update the product within the products array immutably
            state.products = state.products.map(p =>
                p._id === payload.product._id ? payload.product : p
            );
        })

        .addCase(product_image_update.fulfilled, (state, { payload }) => {
            state.product = payload.product; // Update single product state
            state.successMessage = payload.message;
            // Update the product image within the products array immutably
            state.products = state.products.map(p =>
                 p._id === payload.product._id ? payload.product : p
             );
        })
        // Add pending/rejected for image update if needed

        // +++ START: Add Cases for delete_product +++
        .addCase(delete_product.pending, (state, { meta }) => {
            // state.loadingAction = true; // Use action loader if defined
            // Optionally mark the specific product as deleting in the UI?
            // const productId = meta.arg;
            // state.products = state.products.map(p => p._id === productId ? { ...p, isDeleting: true } : p);
            state.errorMessage = "";
            state.successMessage = "";
        })
        .addCase(delete_product.rejected, (state, { payload, meta }) => {
            // state.loadingAction = false;
            state.errorMessage = payload?.error || payload?.message || 'Failed to delete product';
            // Optionally revert optimistic UI changes
            // const productId = meta.arg;
            // state.products = state.products.map(p => p._id === productId ? { ...p, isDeleting: false } : p);
        })
        .addCase(delete_product.fulfilled, (state, { payload }) => {
            // state.loadingAction = false;
            state.successMessage = payload.message;
            // NOTE: Relying on the component to refetch the list after success
            // OR uncomment below to filter immediately (can cause issues if refetch also happens)
            // state.products = state.products.filter(p => p._id !== payload.productId);
            // state.totalProduct = state.totalProduct > 0 ? state.totalProduct - 1 : 0;
        });
        // +++ END: Add Cases for delete_product +++
    }

})
export const { messageClear } = productReducer.actions // Removed clearCurrentProduct if not added
export default productReducer.reducer