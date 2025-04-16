import { createSlice } from "@reduxjs/toolkit";
import { updateCart } from "../../../Utils/cartUtils";

// Function to get the user’s cart using the user ID
const getUserCart = () => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo"));
  const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely

  if (!loggedInUserId) return { cartItems: [], shippingAddress: {}, paymentMethod: "PayPal" };

  const allCarts = JSON.parse(localStorage.getItem("carts")) || {}; // Get all carts
  return allCarts[loggedInUserId] || { cartItems: [], shippingAddress: {}, paymentMethod: "PayPal" };
};

const initialState = getUserCart();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
addToCart: (state, action) => {
  const { user, rating, numReviews, reviews, qty = 1, ...item } = action.payload; // Extract qty

  console.log("Current cart before adding:", JSON.stringify(state.cartItems, null, 2));
  console.log("New item to add:", item);

  const newItem = {
    ...item,
    qty, // Explicitly set qty
    isBundle: item.isBundle || false,
    discount: item.discount || 0,
  };

  console.log("Processed newItem:", newItem);

  if (!newItem.isBundle) {
    console.log("Looking for existing item with _id:", newItem._id);

    // Find if the item exists in the cart as a non-bundle
const existItem = state.cartItems.find((x) =>
  String(x._id) === String(newItem._id) && x.isBundle === false
);


    console.log("Existing item found:", existItem);
 


    if (existItem) {
      console.log(`Updating quantity of existing item ${existItem._id}`);
      state.cartItems = state.cartItems.map((x) =>
        x._id === existItem._id && x.isBundle === false
          ? { ...x, qty: existItem.qty + qty }
          : x
      );
    } else {
      console.log(`Adding new item ${newItem._id} as an individual product`);
      state.cartItems = [...state.cartItems, newItem];
    }
  } else {
    console.log(`Adding bundle ${newItem._id}`);
    state.cartItems = [...state.cartItems, newItem];

    // Add each product inside the bundle separately
    item.products?.forEach((product) => {
      console.log(`Adding bundled product ${product._id}`);
      state.cartItems.push({ ...product, qty: 1, isBundle: true });
    });
  }

  console.log("Cart after adding:", JSON.stringify(state.cartItems, null, 2));
  return updateCart(state);
},


setQuantity: (state, action) => {
  const { _id, qty } = action.payload; // Extract product ID and new quantity

  console.log("Setting quantity for item:", _id, "New quantity:", qty);

  const existItem = state.cartItems.find(
    (x) => String(x._id) === String(_id) && x.isBundle === false
  );

  console.log("Existing item found:", existItem);

  if (existItem) {
    state.cartItems = state.cartItems.map((x) =>
      x._id === existItem._id && x.isBundle === false
        ? { ...x, qty: qty } // Directly update quantity
        : x
    );
  }

  console.log("Cart after updating quantity:", JSON.stringify(state.cartItems, null, 2));
  return updateCart(state);
},

removeFromCart: (state, action) => {
  state.cartItems = state.cartItems.filter((x) => {
    // Only remove the item if it's not part of a bundle OR if it's explicitly removed as part of a bundle
    return !(x._id === action.payload.id && x.bundleId === action.payload.bundleId);
  });
  return updateCart(state);
},

    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      return updateCart(state);
    },

    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      return updateCart(state);
    },

    clearCartItems: (state) => {
      state.cartItems = [];
      return updateCart(state);
    },

    resetCart: (state) => {
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely
      if (loggedInUserId) {
        const allCarts = JSON.parse(localStorage.getItem("carts")) || {};
        delete allCarts[loggedInUserId]; // Remove only the logged-in user's cart
        localStorage.setItem("carts", JSON.stringify(allCarts));
      }
      return getUserCart(); // Reset the cart with the user's cart data
    },

   refreshCart:(state)=>{
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely
    
      if (!loggedInUserId) return { cartItems: [], shippingAddress: {}, paymentMethod: "PayPal" };
    
      const allCarts = JSON.parse(localStorage.getItem("carts")) || {}; // Get all carts
      return allCarts[loggedInUserId] || { cartItems: [], shippingAddress: {}, paymentMethod: "PayPal" };
    
    
  }},

  
  
});

export const {
  addToCart,
  removeFromCart,
  savePaymentMethod,
  saveShippingAddress,
  clearCartItems,
  resetCart,refreshCart,setQuantity
} = cartSlice.actions;

export default cartSlice.reducer;