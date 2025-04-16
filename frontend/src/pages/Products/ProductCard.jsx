import { Link } from "react-router-dom";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux"; // useSelector to get cart state
import { addToCart } from "../../redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductCard = ({ p }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems); // Get cart state
    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
  const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely
  // Find if the product exists in the cart
  const existingItem = cartItems.find((item) => item._id === p._id);
  const currentQty = existingItem ? existingItem.qty : 0; // Get current qty in cart
  const isOutOfStock = currentQty >= p.countInStock; // Disable button if stock is reached

const addToCartHandler = (product, qty) => {
  if (!isOutOfStock) {
    dispatch((dispatch, getState) => {
      const existItem = cartItems.find((x) =>
        String(x._id) === String(product._id) && x.isBundle === false
      );

      // Always pass just `qty` to Redux, let Redux handle updating
      dispatch(addToCart({ ...product, qty:1 }));
      toast.success("Item added successfully");
    });
  }
};


  return (
    <div className="w-64 min-h-[350px] flex flex-col justify-between bg-[#1A1A1A] rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
      <section className="relative">
        <Link to={`/product/${p._id}`}>
          <span className="absolute bottom-3 right-3 bg-pink-100 text-pink-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300">
            {p?.brand}
          </span>
          <img
            className="cursor-pointer w-full h-[170px] object-cover rounded-t-lg"
            src={p.image}
            alt={p.name}
          />
        </Link>
      </section>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center">
          <h5 className="mb-2 text-xl font-semibold text-white">{p?.name}</h5>
          <p className="font-semibold text-pink-500">
            {p?.price?.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>

        <p className="mb-3 font-normal text-[#CFCFCF] flex-grow">
          {p?.description?.substring(0, 60)} ...
        </p>

        <section className="flex justify-between items-center mt-auto">
          <Link
            to={`/product/${p._id}`}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-pink-700 rounded-lg hover:bg-pink-800"
          >
            Read More
            <svg className="w-3.5 h-3.5 ml-2" viewBox="0 0 14 10" fill="none">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </Link>

          {/* Disable button if out of stock */}
        {loggedInUserId ? (
  <button
    className={`p-2 rounded-full ${
      isOutOfStock
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-gray-700 hover:bg-gray-600"
    }`}
    onClick={() => addToCartHandler(p, 1)}
    disabled={isOutOfStock}
  >
    {isOutOfStock ? (
      <span className="text-white font-semibold text-sm">Out of Stock</span>
    ) : (
      <AiOutlineShoppingCart size={25} color="white" />
    )}
  </button>
) : (
  <></>
)}
        </section>
      </div>
    </div>
  );
};

export default ProductCard;
