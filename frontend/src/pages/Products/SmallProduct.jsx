import { Link } from "react-router-dom";
import HeartIcon from "./HeartIcon";

/* const SmallProduct = ({ product }) => {
  return (
    <div className="w-[20rem] ml-[2rem] p-3">
      <div className="relative">

@@ -10,6 +10,7 @@ import HeartIcon from "./HeartIcon";
          alt={product.name}
          className="h-auto rounded"
        />

      </div>

      <div className="p-4">

@@ -25,37 +26,5 @@ import HeartIcon from "./HeartIcon";
    </div>
  );
};
 */



const SmallProduct = ({ product }) => {
  return (
    <div className="w-[20rem] ml-[2rem] p-3">
      <div className="relative">
        {/* Image Container */}
        <div className="w-full h-64 overflow-hidden rounded"> {/* Fixed height for consistency */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded" // Ensures the image covers the container
          />
        </div>
      </div>

      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h2 className="flex justify-between items-center">
            <div>{product.name}</div>
            <span className="bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300">
              ${product.price}
            </span>
          </h2>
        </Link>
      </div>
    </div>
  );
};


export default SmallProduct;