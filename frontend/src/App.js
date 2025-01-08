import React, { useContext, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Sidebar from "./components/Sidebar/Sidebar";
import Consumption from "./pages/Consumption";
import Spending from "./pages/Spending";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Feedback from "./pages/Feedback";

// Debug Sidebar Import
console.log("Sidebar Loaded:", typeof Sidebar === "function");

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { token } = useContext(AuthContext); // Use token instead of user
    return token ? children : <Navigate to="/login" replace />;
};

// Route Configuration Array
const routes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/consumption", element: <Consumption /> },
    { path: "/spending", element: <Spending /> },
    { path: "/analytics", element: <Analytics /> },
    { path: "/profile", element: <Profile /> },
    { path: "/help", element: <Help /> },
    { path: "/feedback", element: <Feedback /> },
];

// Main App Component
function App() {
    const { token, setToken } = useContext(AuthContext); // Access token and setter

    // Persist Authentication from LocalStorage/SessionStorage
    useEffect(() => {
        const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (savedToken && !token) {
            setToken(savedToken); // Restore token if it exists
        }
    }, [token, setToken]); // React only when dependencies change

    return (
        <div className="app-container">
            {/* Render Sidebar only if authenticated */}
            {token && typeof Sidebar === "function" && <Sidebar />}
            <div className="content">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />

                    {/* Protected Routes */}
                    {routes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
                        />
                    ))}

                    {/* Catch-All Route */}
                    <Route
                        path="*"
                        element={
                            <Navigate to={token ? "/dashboard" : "/login"} replace />
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

export default App;
