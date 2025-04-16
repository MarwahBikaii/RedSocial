import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import { addToCart } from "../../redux/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";



const UserOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  const dispatch = useDispatch();
    const navigate = useNavigate();


  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const userId = userInfo?.data?.user?._id;
        const { data } = await axios.get(
          `http://localhost:3000/api/orders/mine?userId=${userId}`,
          { withCredentials: true }
        );
        
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const reorderHandler = async (orderId) => {
    try {
      const { data:reorderedItems  } = await axios.post(
        `http://localhost:3000/api/orders/${orderId}/reorder`
      );

      // Store reordered items in local storage (simulating a cart)
      localStorage.setItem("cartItems", JSON.stringify(reorderedItems));


     // Dispatch each product with its quantity to the Redux store
    reorderedItems.forEach((product) => {
      dispatch(addToCart({ ...product, qty: product.qty }));
    });

      // Redirect to cart
      navigate("/cart");
    } catch (error) {
      console.error("Error reordering:", error.response?.data || error.message);
    }
  };

  const filteredOrders = orders.filter((order) =>
    activeTab === "active" ? !order.isDelivered : order.isDelivered
  );



  
  
  return (
    <div className="container mt-10 mx-auto px-4 py-8">
      <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
        My Orders
      </h2>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 font-semibold border-b-4 transition-all duration-200 ${
            activeTab === "active" ? "border-blue-600 text-blue-600" : "border-gray-300 text-gray-500"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Orders
        </button>
        <button
          className={`px-4 py-2 ml-4 font-semibold border-b-4 transition-all duration-200 ${
            activeTab === "completed" ? "border-blue-600 text-blue-600" : "border-gray-300 text-gray-500"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Orders
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : filteredOrders.length === 0 ? (
        <Message variant="info">No {activeTab === "active" ? "active" : "completed"} orders found</Message>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order ID: <span className="text-blue-600">{order._id}</span>
                </h3>
                <p className="text-sm text-gray-500">
                  {order.createdAt.substring(0, 10)}
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <p className="text-xl font-bold text-gray-800">${order.totalPrice}</p>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 text-white rounded-full text-sm ${
                      order.isPaid ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Not Paid"}
                  </span>
                  <span
                    className={`px-3 py-1 text-white rounded-full text-sm ${
                      order.isDelivered ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {order.isDelivered ? "Delivered" : "Not Delivered"}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-5">
                <h4 className="text-md font-semibold text-gray-700">Order Items:</h4>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  {order.orderItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-gray-600">Qty: {item.qty}</p>
                        <p className="text-gray-800 font-medium">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Details & Reorder Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <Link to={`/order/${order._id}`}>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-all duration-200">
                    View Details
                  </button>
                </Link>

                {/* Show Reorder button only for completed orders */}
                {order.isPaid && order.isDelivered && (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-md transition-all duration-200"
                    onClick={() => reorderHandler(order._id)}
                  >
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrder;

