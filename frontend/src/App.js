import React, { useContext, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Ensure proper import
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
  const { token } = useContext(AuthContext);
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

function App() {
  const { token, login, logout } = useContext(AuthContext);

  // Persist Authentication
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser && !token) {
      login({
        access_token: savedToken,
        user: JSON.parse(savedUser),
      });
    }
  }, [token, login]);

  // Auto Logout on Token Expiration
  useEffect(() => {
    const calculateTokenExpirationTime = () => {
      if (!token) return null;

      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp) {
          const expirationTime = decodedToken.exp * 1000 - Date.now();
          return expirationTime > 0 ? expirationTime : 0;
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
      return null;
    };

    const expirationTime = calculateTokenExpirationTime();

    if (token && expirationTime) {
      const timer = setTimeout(() => {
        logout();
      }, expirationTime);

      return () => clearTimeout(timer);
    }
  }, [token, logout]);

  return (
    <div className="app-container">
      {/* Sidebar visible only if authenticated */}
      {token && <Sidebar />}
      <div className={token ? "content with-sidebar" : "content"}>
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
            element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
