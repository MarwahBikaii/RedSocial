import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { addToCart } from "../../redux/features/cart/cartSlice";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import BundleContainer from "./BundleContainer";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Recommendation = () => {
  const [recommended, setRecommended] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const recommendedRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        // Fetch bundles (always shown)
        const { data: bundlesData } = await axios.get(
          "http://localhost:3000/api/bundles"
        );
        setBundles(bundlesData);

        if (userInfo) {
          // Fetch recommended products for logged-in users
          const userId = userInfo?.data?.user?._id;
          const { data: recommendedData } = await axios.get(
            `http://localhost:3000/api/products/recommendations?userId=${userId}`,
            { withCredentials: true }
          );
          setRecommended(recommendedData);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddBundleToCart = async (bundleId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/bundles/${bundleId}/products`
      );
      const products = await response.json();

      products.forEach((product) => {
        dispatch(addToCart({ ...product, qty: 1 }));
      });

      toast.success("Bundle added to cart successfully");
    } catch (error) {
      console.error("Error adding bundle products to cart:", error);
      toast.error("Failed to add bundle to cart");
    }
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Our Recommendations for You
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {bundles.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Recommended Bundles
              </h3>
              <BundleContainer bundles={bundles} />
            </>
          )}

          {recommended.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6">
                Recommended Items
              </h3>
              <div className="relative">
                <button
                  onClick={() => scroll(recommendedRef, "left")}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full shadow-md"
                >
                  <ChevronLeft size={24} />
                </button>
                <div
                  ref={recommendedRef}
                  className="flex overflow-x-auto space-x-4 scrollbar-hide"
                >
                  {recommended.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white p-4 rounded-lg shadow-lg min-w-[250px] max-w-[250px]"
                    >
                      <Link to={`/product/${product._id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      </Link>
                      <h3 className="text-lg font-semibold mt-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600">${product.price}</p>
                      <Link to={`/product/${product._id}`} className="text-blue-500">
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scroll(recommendedRef, "right")}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full shadow-md"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Recommendation;
