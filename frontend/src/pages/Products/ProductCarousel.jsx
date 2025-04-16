import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";  // Import Link
import axios from "axios";
import Message from "../../components/Message";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import moment from "moment";
import {
  FaBox,
  FaClock,
  FaComment,
  FaShoppingCart,
  FaStar,
  FaStore,
} from "react-icons/fa";

const ProductCarousel = () => {
  // State variables for products, loading, and error
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slider settings for react-slick
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  // Fetch the top products using Axios when the component mounts
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        // Make a GET request to fetch the top products
        const response = await axios.get("http://localhost:3000/api/products/top"); // Adjust the URL as needed
        setProducts(response.data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  // If still loading, you can return a loader or null
  if (isLoading) {
    return null;
  }

  // If there's an error, display a message
  if (error) {
    return (
      <Message variant="danger">
        {error?.response?.data?.message || error.message}
      </Message>
    );
  }

  // Render the carousel slider with the fetched products
  return (
    <div className="mb-4 xl:block lg:block md:block">
      <Slider
        {...settings}
        className="xl:w-[50rem] lg:w-[50rem] md:-[56rem] sm:w-[40rem] sm:block"
      >
        {products.map(
          ({
            image,
            _id,
            name,
            price,
            description,
            brand,
            createdAt,
            numReviews,
            rating,
            quantity,
            countInStock,
          }) => (
            <div key={_id}>
              <Link to={`/product/${_id}`}>  {/* Link added here */}
                <img
                  src={image}
                  alt={name}
                  className="w-full rounded-lg object-cover h-[30rem]"
                />
              </Link>

              
            </div>
          )
        )}
      </Slider>
    </div>
  );
};

export default ProductCarousel;
