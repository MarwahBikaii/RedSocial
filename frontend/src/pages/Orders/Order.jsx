import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Import SweetAlert2


import axios from "axios";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import "react-toastify/dist/ReactToastify.css";

const Order = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDeliver, setLoadingDeliver] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);

  const navigate = useNavigate();

const cancelOrderHandler = async () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo")); // Parse stored string to object
  const userId = userInfo?.data?.user?._id; // Extract user _id

  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to cancel this order? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it!",
    cancelButtonText: "No, keep it",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/orders/${orderId}/cancel?userId=${userId}`, {
          withCredentials: true,
        });

        Swal.fire({
          title: "Order Canceled",
          text: "Your order has been successfully canceled.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        setTimeout(() => {
          navigate("/shop");
        }, 2000); // 2-second delay before redirecting
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: error.response?.data?.message || error.message,
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    }
  });
};


  

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
          withCredentials: true,
        });
        console.log("Order is", data);
        setOrder(data);
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const deliverHandler = async () => {
    try {
      setLoadingDeliver(true);
      await axios.put(`/api/orders/${orderId}/deliver`);
      setOrder({ ...order, isDelivered: true });
      toast.success("Order marked as delivered");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoadingDeliver(false);
    }
  };

  return loading ? (
    <Loader />
  ) : !order ? (
    <Message variant="danger">Order not found</Message>
  ) : (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Order Details */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <p><span className="font-semibold">Name:</span> {order.user.username}</p>
          <p><span className="font-semibold">Email:</span> {order.user.email}</p>
          <p><span className="font-semibold">Address:</span> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
          <p className={`mt-2 p-2 text-white rounded-lg ${order.isDelivered ? "bg-green-500" : "bg-red-500"}`}>
            {order.isDelivered ? `Delivered` : "Not Delivered"}
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">Payment Details</h2>
          <p><span className="font-semibold">Payment Method:</span> {order.paymentMethod}</p>
          <p className={`mt-2 p-2 text-white rounded-lg ${order.isPaid ? "bg-green-500" : "bg-red-500"}`}>
            {order.isPaid ? `Paid` : "Not Paid"}
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">Order Items</h2>
          {order.orderItems.length === 0 ? (
            <Message variant="warning">Order is empty</Message>
          ) : (
            <div>
              {order.orderItems.map((item) => (
                <div key={item.product} className="flex items-center justify-between border-b py-2">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                  <p>{item.name}</p>
                  <p>{item.qty} x ${item.price} = ${item.qty * item.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="flex justify-between">
            <span>Items Price:</span>
            <span>${order.itemsPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Price:</span>
            <span>${order.taxPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Price:</span>
            <span>${order.shippingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Price:</span>
            <span>${order.totalPrice.toFixed(2)}</span>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-4">Order Status</h2>
        
          {(!order.isPaid && !order.isDelivered) && (
    <p className="p-2 rounded-lg text-white text-center bg-yellow-500 mt-2">Active</p>
  )}

  
{(order.isPaid && order.isDelivered) && (
    <p className="p-2 rounded-lg text-white text-center bg-green-500 mt-2">Completed</p>
  )}
{!order.isPaid && !order.isCanceled && (
  <button
    onClick={cancelOrderHandler}
    className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg w-full"
  >
    Cancel Order
  </button>
)}
          <h2 className="text-xl font-semibold mt-6 mb-4">Timestamps</h2>
          <p><span className="font-semibold">Created At:</span> {new Date(order.createdAt).toLocaleString()}</p>
          <p><span className="font-semibold">Updated At:</span> {new Date(order.updatedAt).toLocaleString()}</p>

          {loadingDeliver && <Loader />}
          {userInfo?.isAdmin && order.isPaid && !order.isDelivered && (
            <button onClick={deliverHandler} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg w-full">
              Mark As Delivered
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Order;