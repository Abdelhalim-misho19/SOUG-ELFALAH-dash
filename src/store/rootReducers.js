import OrderReducer from "./Reducers/OrderReducer";
import PaymentReducer from "./Reducers/PaymentReducer";
import authReducer from "./Reducers/authReducer";
import bannerReducer from "./Reducers/bannerReducer";
import categoryReducer from "./Reducers/categoryReducer";
import chatReducer from "./Reducers/chatReducer";
import dashboardReducer from "./Reducers/dashboardReducer";
import productReducer from "./Reducers/productReducer";
import sellerReducer from "./Reducers/sellerReducer";
import serviceCategoryReducer from './Reducers/serviceCategoryReducer';
import serviceReducer from './Reducers/serviceReducer';
import adBannerReducer from './Reducers/adBannerReducer'; // +++ Import the new reducer +++
import bookingReducer from './Reducers/BookingReducer'; // <<< ADD THIS
import analyticsReducer from './Reducers/analyticsReducer'; // New import
import notificationReducer from './Reducers/notificationReducer';




const rootReducer = {
    auth: authReducer,
    category: categoryReducer,
    serviceCategory: serviceCategoryReducer,
    product: productReducer,
    service: serviceReducer,
    seller: sellerReducer,
    chat: chatReducer,
    order: OrderReducer,
    payment: PaymentReducer,
    dashboard: dashboardReducer,
    banner: bannerReducer,
    adBanner: adBannerReducer, // +++ Add the new ad banner reducer +++
    booking: bookingReducer, // <<< INCLUDE BOOKING REDUCER
    analytics: analyticsReducer, // Add analytics reducer
    notifications: notificationReducer,
    
}
export default rootReducer;