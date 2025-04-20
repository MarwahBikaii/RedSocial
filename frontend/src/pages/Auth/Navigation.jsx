import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaUser, FaSignOutAlt, FaBell, FaBars, FaTimes } from "react-icons/fa";
import logo from "./logo.png";
import "./Navigation.css";
import { AuthContext } from "../../AuthContext"; // adjust path

const Navigation = () => {
  const navigate = useNavigate();

  const { isLoggedIn, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);

  const logoutHandler = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/users/logout", {}, { withCredentials: true });
      if (response.status === 200) {
        logout(); // Update global state
        await Swal.fire({ icon: "success", title: "Logged out successfully!", showConfirmButton: false, timer: 1500 });
     localStorage.removeItem("userInfo",JSON.stringify(response.data));

        navigate("/login");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Logout failed", text: err.response?.data?.message || "Please try again" });
    }
  };

  return (
    <nav className="bg-[#00CCCC] shadow-md py-3 px-6 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="RedSocial Logo" className="h-20 mr-3" />
        </Link>
      </div>

      <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <div className={`md:flex space-x-4 items-center ${menuOpen ? "flex flex-col absolute top-16 left-0 w-full bg-[#00CCCC] shadow-lg py-4" : "hidden md:flex"}`}>
        <Link to="/EducationalContent" className="bg-[#ff3131] hover:bg-[#e62a2a] text-white font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md" onClick={() => setMenuOpen(false)}>
          Learn More
        </Link>

        {isLoggedIn ? (
          <>
            <Link to="/bloodRequests" className="bg-white hover:bg-[#e62a2a] text-[#0097b2] font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md" onClick={() => setMenuOpen(false)}>
              Start To Help
            </Link>
            <Link to="/RequestForm" className="bg-[#ff3131] text-white hover:bg-gray-100 font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md" onClick={() => setMenuOpen(false)}>
              I need blood
            </Link>
            <Link to="/myRequests" className="bg-white text-[#0097b2] hover:bg-gray-100 font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md" onClick={() => setMenuOpen(false)}>
              My Requests
            </Link>

            <Link to="/notifications" className="relative text-white hover:text-gray-200 px-4 py-2 transition-all duration-300" onClick={() => setMenuOpen(false)}>
              <FaBell size={20} />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
            </Link>

            <Link to="/profile" className="flex items-center text-white hover:text-gray-200 font-medium px-4 py-2 transition-all duration-300" onClick={() => setMenuOpen(false)}>
              <FaUser className="mr-2" /> Profile
            </Link>

            <button onClick={() => { logoutHandler(); setMenuOpen(false); }} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md">
              <FaSignOutAlt className="mr-2" /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-white hover:text-gray-200 font-medium px-4 py-2 transition-all duration-300" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/register" className="bg-white text-[#0097b2] hover:bg-gray-100 font-medium rounded-full px-6 py-2 transition-all duration-300 shadow-md" onClick={() => setMenuOpen(false)}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
