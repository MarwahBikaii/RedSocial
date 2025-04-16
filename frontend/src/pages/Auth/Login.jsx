import { useState, useEffect } from "react";
import axios from "axios";
import { setCredentials } from "../../redux/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { refreshCart } from "../../redux/features/cart/cartSlice";
import { auth, provider } from "../../Firebase"; 
import { signInWithPopup } from "firebase/auth";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get("redirect") || "/";

    const signInWithGoogle = async (e) => {
        e.preventDefault();
        try {
            const result = await signInWithPopup(auth, provider);
            setLoading(true);
            
            const res = await axios.post("http://localhost:3000/api/users/loginWithGoogle", {
                googleId: result.user.uid,
                email: result.user.email,
            }, { withCredentials: true });

            localStorage.setItem("token", res.data.token);
            dispatch(setCredentials(res.data));
            dispatch(refreshCart());
            
            toast.success("Login successful!");
            setTimeout(() => navigate(redirect), 1500);
        } catch (error) {
            toast.error(error.response?.status === 400 ? 
                       "User not found" : 
                       "Google Sign-In Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(
                "http://localhost:3000/api/users/auth/login",
                { email, password },
                { withCredentials: true }
            );

            localStorage.setItem("token", response.data.token);
            dispatch(setCredentials(response.data));
            dispatch(refreshCart());
            
            toast.success("Login successful!");
            setTimeout(() => navigate(redirect), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center pt-2 bg-gradient-to-r from-[#0097b2]/10 to-[#ff3131]/10 px-4 min-h-[90vh]">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg mt-[-50px]"> {/* Negative margin pulls form up */}
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-[#0097b2] mb-2">Welcome Back</h1>
                    <p className="text-gray-600 mb-6 text-base">Login to continue saving lives</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097b2]"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097b2]"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 bg-[#0097b2] hover:bg-[#007a91] text-white font-medium rounded-lg transition-all ${loading ? 'opacity-80' : ''}`}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-2 bg-white text-sm text-gray-500">or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <img 
                            src="https://developers.google.com/identity/images/g-logo.png" 
                            alt="Google logo" 
                            className="w-5 h-5"
                        />
                        Sign in with Google
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-[#0097b2] hover:text-[#007a91]">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
};

export default Login;