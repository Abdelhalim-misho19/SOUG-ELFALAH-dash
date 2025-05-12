import { AiOutlineDashboard, AiOutlineShoppingCart } from "react-icons/ai";
import { BiCategory } from "react-icons/bi";
import { FaUserTimes, FaUsers } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { FaCodePullRequest } from "react-icons/fa6";
import { IoIosChatbubbles } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { MdViewList } from "react-icons/md";
import { TbBasketDiscount } from "react-icons/tb";
import { BsCartCheck } from "react-icons/bs"; 
import { IoChatbubbles } from "react-icons/io5";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { MdOutlineCampaign } from "react-icons/md"; // Example Ad Banner Icon
import { MdOutlineMiscellaneousServices,MdOutlineCalendarMonth } from "react-icons/md"; // Or choose another relevant icon


export const allNav = [
    {
        id : 1,
        title : 'Dashboard',
        icon : <AiOutlineDashboard />,
        role : 'admin',
        path: '/admin/dashboard'
    },
    {
        id : 2,
        title : 'Orders',
        icon : <AiOutlineShoppingCart />,
        role : 'admin',
        path: '/admin/dashboard/orders'
    },
    {
        id : 3,
        title : 'Add Product Category',
        icon : <BiCategory  />,
        role : 'admin',
        path: '/admin/dashboard/category'
    },
    {
        id: 4,
        title: 'Add Service Category',
        icon: <IoMdAdd />, // Reuse the "add" icon
        role: 'admin',
        path: '/admin/dashboard/add-category'
    },
    {
        id : 5,
        title : 'Sellers',
        icon : <FaUsers   />,
        role : 'admin',
        path: '/admin/dashboard/sellers'
    },
    {
        id : 6,
        title : 'Payment Request',
        icon : <MdPayment />,
        role : 'admin',
        path: '/admin/dashboard/payment-request'
    },
    {
        id : 7,
        title : 'Deactive Sellers',
        icon : <FaUserTimes />,
        role : 'admin',
        path: '/admin/dashboard/deactive-sellers'
    },
    {
        id : 8,
        title : 'Seller Request',
        icon : <FaCodePullRequest />,
        role : 'admin',
        path: '/admin/dashboard/sellers-request'
    },
    {
        id : 9,
        title : 'Live Chat',
        icon : <IoIosChatbubbles />,
        role : 'admin',
        path: '/admin/dashboard/chat-sellers'
    },
    { // +++ New Admin Ad Banner Route +++
        id: 10, // Adjust ID
        title: 'Ad Banners',
        icon: <MdOutlineCampaign />, // Use an appropriate icon
        role: 'admin',
        path: '/admin/dashboard/ad-banners' // Link to the list/management page
    },
   
    {
        id : 11,
        title : 'Dashboard',
        icon : <AiOutlineDashboard />,
        role : 'seller',
        path: '/seller/dashboard'
    },
    {
        id : 12,
        title : 'Add Product',
        icon : <IoMdAdd />,
        role : 'seller',
        path: '/seller/dashboard/add-product'
    },     
    {
        id : 13,
        title : 'All Product',
        icon : <MdViewList />,
        role : 'seller',
        path: '/seller/dashboard/products'
    },
   /* {
        id : 14,
        title : 'Discount Product',
        icon : <TbBasketDiscount />,
        role : 'seller',
        path: '/seller/dashboard/discount-product'
    },*/
    {
        id : 15,
        title : 'Orders',
        icon : <BsCartCheck />,
        role : 'seller',
        path: '/seller/dashboard/orders'
    },
    {
        id: 16,
        title: 'Add Service',
        icon: <IoMdAdd />,
        role: 'seller',
        path: '/seller/dashboard/add-service'
    },
    {
        id: 17, // Ensure unique ID
        title: 'All Services',
        icon: <MdOutlineMiscellaneousServices />, // Or <MdViewList />
        role: 'seller',
        path: '/seller/dashboard/services'
    },
    {
        id: 18, // Ensure unique ID
        title: 'Service Bookings',
        icon: <MdOutlineCalendarMonth />, // Use a calendar or booking icon
        role: 'seller',
        path: '/seller/dashboard/bookings' // New path
    },
    {
        id : 19,
        title : 'Payments',
        icon : <MdPayment />,
        role : 'seller',
        path: '/seller/dashboard/payments'
    },
    {
        id : 20,
        title : 'Chat-Customer',
        icon : <IoChatbubbles />,
        role : 'seller',
        path: '/seller/dashboard/chat-customer'
    },
    {
        id : 21,
        title : 'Chat-Support',
        icon : <BsFillChatQuoteFill />,
        role : 'seller',
        path: '/seller/dashboard/chat-support'
    },
    {
        id : 22,
        title : 'Profile',
        icon : <CgProfile />,
        role : 'seller',
        path: '/seller/dashboard/profile'
    },
    



]