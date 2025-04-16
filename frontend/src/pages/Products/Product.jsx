import { Link } from "react-router-dom";

const Product = ({ product }) => {
  return (
    <div className="w-[30rem] h-[40rem] ml-[2rem] p-3 relative flex flex-col items-center bg-white shadow-lg rounded-lg">
      <div className="relative w-full h-[25rem]">
        <Link to={`/product/${product._id}`}> {/* Added Link around image */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded"
          />
        </Link>
      </div>

      <div className="p-4 w-full text-center">
        <Link to={`/product/${product._id}`}>
          <h2 className="flex justify-between items-center">
            <div className="text-lg">{product.name}</div>
            <span className="bg-pink-100 text-pink-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300">
              $ {product.price}
            </span>
          </h2>
        </Link>
      </div>
    </div>
  );
};

export default Product;


/* const Product = ({ product }) => {
  return (
    <div className="w-[30rem] ml-[2rem] p-3 relative">
      <div className="relative">

@@ -42,6 +10,7 @@ export default Product;
          alt={product.name}
          className="w-[30rem] rounded"
        />

      </div>

      <div className="p-4">

@@ -58,4 +27,4 @@ export default Product;
  );
};

export default Product; */