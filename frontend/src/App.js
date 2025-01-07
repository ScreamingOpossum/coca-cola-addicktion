import React, { useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword"; // Optional, if implemented

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext); // Check if user is logged in
    return user ? children : <Navigate to="/login" />;
};

// App Component
function App() {
    const { user } = useContext(AuthContext); // Get the user context

    return (
        <Router>
            <Routes>
                {/* Redirect to Login Page by Default */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback Route for Undefined Paths */}
                <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;
