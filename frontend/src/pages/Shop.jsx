import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios"; // Import Axios
import Loader from "../components/Loader";
import { useFetchCategoriesQuery } from "../redux/api/categoryApiSlice";

import { setCategories, setProducts, setChecked } from "../redux/features/shop/shopSlice";
import ProductCard from "./Products/ProductCard.jsx";

const Shop = () => {
  const dispatch = useDispatch();
  const { categories, products, checked, radio } = useSelector((state) => state.shop);

  const categoriesQuery = useFetchCategoriesQuery();
  const [priceFilter, setPriceFilter] = useState([0, 1000]); // Price range filter (min, max)
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFilteredProducts = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/products/filter", {
        checked,
        radio,
      });

      console.log("Fetched Products:", response.data);

      const filteredProducts = response.data.filter((product) => {
        // Filter based on search query and price range
        const matchesSearchQuery =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categories.some((cat) => product.category === cat._id);

        const matchesPriceRange =
          product.price >= priceFilter[0] && product.price <= priceFilter[1];

        return matchesSearchQuery && matchesPriceRange;
      });

      dispatch(setProducts(filteredProducts));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [checked, radio, priceFilter, searchQuery]); // Refetch when filters or search query change

  const handleBrandClick = (brand) => {
    const productsByBrand = products?.filter((product) => product.brand === brand);
    dispatch(setProducts(productsByBrand));
  };

  const handleCheck = (value, id) => {
    const updatedChecked = value ? [...checked, id] : checked.filter((c) => c !== id);
    dispatch(setChecked(updatedChecked));
  };

  const uniqueBrands = [...new Set(products?.map((product) => product.brand))];

  return (
    <div className="container mt-7 bg-white mx-auto">
      <div className="flex md:flex-row">
        <div className="bg-[#151515] p-3 mt-2 mb-2 w-[20rem]">
          <div className="p-5">
          <input
  type="text"
  placeholder="Search by name, category, or description"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full px-3 py-2 placeholder-gray-400 text-pink-600 border rounded-lg focus:outline-none focus:ring focus:border-pink-300"
/>
          </div>

          <div className="p-5">
            {categories?.map((c) => (
              <div key={c._id} className="mb-2">
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    onChange={(e) => handleCheck(e.target.checked, c._id)}
                    className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <label className="ml-2 text-sm font-medium text-white">{c.name}</label>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5">
            {uniqueBrands?.map((brand) => (
              <div className="flex items-center mr-4 mb-5" key={brand}>
                <input
                  type="radio"
                  name="brand"
                  onChange={() => handleBrandClick(brand)}
                  className="w-4 h-4 text-pink-400 bg-gray-100 border-gray-300 focus:ring-pink-500"
                />
                <label className="ml-2 text-sm font-medium text-white">{brand}</label>
              </div>
            ))}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
            <input
  type="number"
  value={priceFilter[0]}
  onChange={(e) => {
    const newValue = parseInt(e.target.value);
    if (newValue >= 0) {
      setPriceFilter([newValue, priceFilter[1]]);
    }
  }}
  className="w-24 px-3 py-2 placeholder-gray-400 text-pink-600 border rounded-lg focus:outline-none focus:ring focus:border-pink-300"
  placeholder="Min"
  min="0"
/>
              <span className="text-white">to</span>
              <input
  type="number"
  value={priceFilter[1]}
  onChange={(e) => {
    const newValue = parseInt(e.target.value);
    if (newValue >= 0) {
      setPriceFilter([priceFilter[0], newValue]);
    }
  }}
  className="w-24 px-3 py-2 placeholder-gray-400 text-pink-600 border rounded-lg focus:outline-none focus:ring focus:border-pink-300"
  placeholder="Max"
  min="0"
/>
            </div>
          </div>

          <div className="p-5 pt-0">
  <button
    className="w-full border border-pink-600 text-pink-600 bg-transparent hover:bg-pink-600 hover:text-white my-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-pink-300"
    onClick={() => window.location.reload()}
  >
    Reset
  </button>
</div>
        </div>

        <div className="p-3 flex-1">
          <h2 className="h4 text-center mb-2">{products?.length} Products</h2>
          <div className="flex flex-wrap">
            {products.length === 0 ? (
              <Loader />
            ) : (
              products?.map((p) => (
                <div className="p-3" key={p._id}>
                  <ProductCard p={p} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
