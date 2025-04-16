import { useState, useEffect } from "react";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status when the component mounts
    useEffect(() => {
        if (localStorage.getItem("token")) {
            setIsLoggedIn(true);
        }
    }, []);

    // Login handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:3000/api/users/auth/login",
                { email, password },
                { withCredentials: true }
            );

            // Store token and update login state
            localStorage.setItem("token", response.data.token);
            setIsLoggedIn(true);
            alert("Login successful!");
            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            // Call the logout API
            const response = await axios.post(
                "http://localhost:3000/api/users/logout",
                {},
                { withCredentials: true }
            );
    
            // Check if the logout was successful
            if (response.status === 200) {
                // Remove the token from localStorage (if used)
                localStorage.removeItem("token");
    
                // Update login state
                setIsLoggedIn(false);
    
                // Show success message
                alert("Logged out successfully!");
    
                // Redirect to the homepage
                window.location.href = "/"; // Or use a client-side router
            } else {
                setError("Logout failed. Please try again.");
            }
        } catch (err) {
            // Handle specific errors
            if (err.response) {
                // Server responded with an error status code (e.g., 401, 500)
                setError(`Logout failed: ${err.response.data.message || "Server error"}`);
            } else if (err.request) {
                // Request was made but no response was received
                setError("Logout failed: No response from the server.");
            } else {
                // Something else went wrong
                setError("Logout failed: An unexpected error occurred.");
            }
            console.error("Logout error:", err);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            {!isLoggedIn ? (
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-96">
                    <h2 className="text-2xl font-bold mb-4">Login</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            ) : (
                <div>
                    <p>You are logged in</p>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded mt-4"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Login;
