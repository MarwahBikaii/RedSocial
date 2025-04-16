import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash } from "react-icons/fa";
import { addToCart, setQuantity, removeFromCart, resetCart } from "../../redux/features/cart/cartSlice";
import Swal from "sweetalert2"; // Import SweetAlert2
import {useState, useEffect} from 'react'
const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { itemsPricebeforeDiscount, itemsPriceAfterDiscount, shippingPrice, taxPrice, totalPrice } = cart;

  const storedUser = JSON.parse(localStorage.getItem("userInfo"));
  const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely

  const { cartItems } = cart;
const userCartItems = cartItems.filter(item => item.userId === loggedInUserId || !item.userId);

console.log("Redux Cart Items:", cartItems);
console.log("Logged in User ID:", loggedInUserId);
console.log("Filtered User Cart Items:", userCartItems);
  // Group items into bundles and separate individual products
  const bundleMap = new Map();
  const individualProducts = [];

  userCartItems.forEach((item) => {
    if (item.bundleId) {
      if (!bundleMap.has(item.bundleId)) {
        bundleMap.set(item.bundleId, []);
      }
      bundleMap.get(item.bundleId).push(item);
    } else {
      individualProducts.push(item);
    }
  });



  const addToCartHandler = (product, qty) => {
    dispatch(setQuantity({ ...product, qty }));
  };


const removeFromCartHandler = (id, bundleId = null) => {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to remove this item from your cart?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, remove it!",
  }).then((result) => {
    if (result.isConfirmed) {
      dispatch(removeFromCart({ id, bundleId }));
      Swal.fire("Removed!", "The item has been removed.", "success");
    }
  });
};

const removeBundleFromCartHandler = (bundleId) => {
  Swal.fire({
    title: "Remove Bundle?",
    text: "Do you want to remove the entire bundle?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, remove it!",
  }).then((result) => {
    if (result.isConfirmed) {
      const bundleItems = bundleMap.get(bundleId) || [];
      bundleItems.forEach((item) => dispatch(removeFromCart({ id: item._id, bundleId })));
      Swal.fire("Removed!", "The bundle has been removed.", "success");
    }
  });
};

const checkoutHandler = async () => {
  try {
    console.log("🛒 Sending cartItems to backend:", userCartItems);

    // ✅ Remove duplicate products (keep only one entry per product ID)
    const uniqueCartItems = Array.from(
      new Map(userCartItems.map(item => [item._id, item])).values()
    );

    const response = await fetch("http://localhost:3000/api/products/check-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItems: uniqueCartItems.map(item => ({ id: item._id, qty: item.qty })) }),
    });

    const data = await response.json();
    console.log("📦 Response from backend:", data);

    if (data.error) {
      console.error("❌ Stock check error:", data.error);
      return;
    }

    // ✅ Correct way to check out-of-stock items
    if (data.outOfStockItems && data.outOfStockItems.length > 0) {
      Swal.fire({
        title: "Stock Unavailable",
        text: `The following items are out of stock: ${data.outOfStockItems.map(item => item.name).join(", ")}`,
        icon: "error",
        confirmButtonText: "OK",
      });

      // Remove out-of-stock items from cart
      data.outOfStockItems.forEach((item) => {
        dispatch(removeFromCart({ id: item.id }));
      });

      return; // Stop checkout process
    }

    // ✅ Proceed to checkout only if all items are in stock
    navigate("/login?redirect=/shipping");

  } catch (error) {
    console.error("❗ Error checking stock:", error);
    Swal.fire("Error", "Unable to verify stock. Try again.", "error");
  }
};


const resetCartHandler = () => {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to clear your cart?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, clear it!",
  }).then((result) => {
    if (result.isConfirmed) {
      dispatch(resetCart());
      Swal.fire("Cleared!", "Your cart has been emptied.", "success");
    }
  });
};


 

  const [forceRender, setForceRender] = useState(false);
useEffect(() => {
  setForceRender(prev => !prev);
}, [cartItems]);
    


  return (
<>
  {userCartItems.length === 0 ? (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <img 
        src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" 
        alt="Empty Cart" 
        className="w-40 h-40 mb-4 opacity-75"
      />
      <h2 className="text-2xl font-semibold text-gray-700">Your Cart is Empty</h2>
      <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
      <Link 
        to="/shop" 
        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300"
      >
        Go To Shop
      </Link>
    </div>
  ) : (
    <div className="w-[80%]">
      <h1 className="text-2xl font-semibold mb-4">Shopping Cart</h1>

      {/* Render Individual Products */}
      {individualProducts.length > 0 && (
        <div className="bg-white shadow-lg p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Individual Products</h2>
          {individualProducts.map((item) => (
            <div key={item._id} className="flex items-center mb-4 pb-2 border-b">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />

              <div className="flex-1 ml-4">
                <Link to={`/product/${item._id}`} className="text-pink-500">{item.name}</Link>
                <div className="text-black font-bold">${(item.price * (1 - item.discount / 100)).toFixed(2)}</div>
              </div>

              <select
                className="w-20 p-1 border rounded text-black"
                value={item.qty}
                onChange={(e) => addToCartHandler(item, Number(e.target.value))}
              >
                {[...Array(item.countInStock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>{x + 1}</option>
                ))}
              </select>

              <button className="text-red-500 ml-4" onClick={() => removeFromCartHandler(item._id)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Render Bundles */}
      {[...bundleMap.keys()].map((bundleId) => (
        <div key={bundleId} className="bg-gray-100 shadow-lg p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Bundle {bundleId}</h2>
          {bundleMap.get(bundleId).map((item) => (
            <div key={item._id} className="flex items-center mb-4 pb-2 border-b">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1 ml-4">
                <Link to={`/product/${item._id}`} className="text-pink-500">{item.name}</Link>
                <div className="text-black font-bold">${(item.price * (1 - item.discount / 100)).toFixed(2)}</div>
              </div>
            </div>
          ))}
          <button
            className="text-red-500 mt-2 py-1 px-3 rounded-lg bg-gray-200 hover:bg-red-500 hover:text-white"
            onClick={() => removeBundleFromCartHandler(bundleId)}
          >
            Remove Bundle
          </button>
        </div>
      ))}

      {/* Order Summary */}
      <div className="mt-8 w-[40rem]">
        <div className="p-4 rounded-lg shadow-lg bg-white">
          <h2 className="text-xl font-semibold mb-2">
            Items ({userCartItems.reduce((acc, item) => acc + item.qty, 0)})
          </h2>

          <div className="text-2xl font-bold">Total after discount:
            ${" "}
            {userCartItems
              .reduce(
                (acc, item) =>
                  acc + item.qty * ((item.price * (100 - item.discount)) / 100),
                0
              )
              .toFixed(2)}
          </div>

          <div className="text-2xl font-bold">
            Subtotal: ${itemsPricebeforeDiscount}
          </div>

          <div className="text-2xl font-bold">
            Discount: -$
            {(
              parseFloat(itemsPricebeforeDiscount) - 
              userCartItems.reduce(
                (acc, item) => acc + item.qty * ((item.price * (100 - item.discount)) / 100),
                0
              )
            ).toFixed(2)}
          </div>

          <div className="text-2xl font-bold">
            Shipping: ${shippingPrice}
          </div>
          <div className="text-2xl font-bold">
            Taxes: ${taxPrice}
          </div>
          <div className="text-2xl font-bold">
            <span className="font-bold">Final Total:</span> $
            {(
              Number(taxPrice) +
              Number(shippingPrice) +
              userCartItems.reduce(
                (acc, item) => acc + item.qty * ((item.price * (100 - item.discount)) / 100),
                0
              )
            ).toFixed(2)}
          </div>

          <button
            className="bg-pink-500 mt-4 py-2 px-4 rounded-full text-lg w-full"
            disabled={userCartItems.length === 0}
            onClick={checkoutHandler}
          >
            Proceed To Checkout
          </button>

          <button
            className="bg-red-500 mt-4 py-2 px-4 rounded-full text-lg w-full"
            onClick={resetCartHandler}
          >
            Reset Cart
          </button>
        </div>
      </div>
    </div>
  )}
</>
  )
};

export default Cart;
