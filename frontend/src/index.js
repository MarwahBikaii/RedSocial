import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Route, RouterProvider, createRoutesFromElements, createBrowserRouter } from "react-router-dom"; 
import { Provider } from "react-redux";
import { store } from "./redux/store.js"; 
import Login from "./pages/Auth/Login.jsx"
import Register from './pages/Auth/Register.jsx'
import Home from './pages/User/Home.jsx'
import Cart from './pages/User/Cart.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetails from "./pages/Products/ProductDetails.jsx";
import PlaceOrder from './pages/Orders/PlaceOrder.jsx'
import Order from './pages/Orders/Order.jsx'
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Shipping from './pages/Orders/Shipping.jsx'
import PrivateRoute from './components/PrivateRoutex.jsx'
import UserOrder from './pages/User/UserOrder.jsx'
import BloodRequests from './pages/User/bloodRequests.jsx'
import RequestForm from './pages/User/RequestForm.jsx'
import MyRequests from './pages/User/MyRequests.jsx'
import Profile from './pages/User/Profile.jsx'
import EducationalContent from './pages/User/EducationalContent.jsx'

// Define the router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>

        <Route path="/bloodRequests" element={<BloodRequests/>} />
       <Route path="/RequestForm" element={<RequestForm/>} />
        <Route path="/myRequests" element={<MyRequests/>} />
        <Route path="/profile" element={<Profile/>} />
       <Route path="/EducationalContent" element={<EducationalContent/>} />

       <Route path="/register" element={<Register/>} />
              <Route path="/login" element={<Login/>} />

       <Route index={true } path="/" element={<Home/>} />

       <Route  path="/cart" element={<Cart/>} />
       <Route  path="/shop" element={<Shop/>} />
       <Route  path="/product/:id" element={<ProductDetails/>} />
       <Route  path="/user-orders" element={<UserOrder/>} />
       <Route path="" element={<PrivateRoute />}>
        {/* <Route path="/profile" element={<Profile />} /> */}
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/placeorder" element={<PlaceOrder />} />
        <Route path="/order/:id" element={<Order />} />
      </Route>

    </Route>

    
  )
);

// ✅ Wrap the entire application inside <Provider>
ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>  
    <PayPalScriptProvider><RouterProvider router={router} /></PayPalScriptProvider>
    
  </Provider>

  
);

console.log('App mounted'); // Add this to check if the render is happening

