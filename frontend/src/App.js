import React, { useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Sidebar from "./components/Sidebar/Sidebar"; // Ensure Sidebar is default exported
import Consumption from "./pages/Consumption";
import Spending from "./pages/Spending";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Feedback from "./pages/Feedback";

// Debug Logs
console.log(Sidebar); // Check if Sidebar is undefined

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" replace />;
};

// App Component
function App() {
    const { user } = useContext(AuthContext);

    return (
        <Router>
            <div className="app-container">
                {/* Only show Sidebar if user exists */}
                {user && typeof Sidebar === "function" && <Sidebar />}
                <div className="content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgotpassword" element={<ForgotPassword />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/consumption" element={<ProtectedRoute><Consumption /></ProtectedRoute>} />
                        <Route path="/spending" element={<ProtectedRoute><Spending /></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />

                        {/* Catch-all Route */}
                        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
