import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "./Loader";
import ProductCarousel from "../pages/Products/ProductCarousel";

const Header = () => {
  const [data, setData] = useState([]); // Holds the top products
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    // Define an async function to fetch data using Axios
    const fetchTopProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/products/top"); // Adjust the URL as needed
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopProducts();
  }, []); // Runs only once when component mounts

  if (isLoading) {
    return <Loader />; // Show loader while fetching data
  }

  if (error) {
    return <h1 className="text-red-500 font-bold text-center">ERROR: {error.message}</h1>; // Show error message
  }

  return (
    <div className="flex flex-col items-center">
      {/* "Our Best Sellers" Title */}
      <h1 className=" mt-[10rem] text-[3rem]">Our Best Sellers</h1>

      {/* Product carousel with margin-top */}
      <div className="mt-10">
        <ProductCarousel products={data} /> {/* Pass fetched data to the carousel */}
      </div>
    </div>
  );
};

export default Header;
