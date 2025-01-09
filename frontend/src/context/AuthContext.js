import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Create Context
export const AuthContext = createContext();

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  // State Variables
  const [user, setUser] = useState(null); // Stores user data
  const [token, setToken] = useState(null); // Stores auth token
  const navigate = useNavigate(); // React Router hook for navigation

  // Load token and user data from localStorage when the app starts
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser)); // Parse user JSON data
      } catch (error) {
        console.error("Failed to load user data:", error);
        localStorage.clear(); // Clear corrupted data
      }
    }
  }, []);

  // Persist token and user data when state updates
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // Helper function to clear auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    navigate("/login"); // Redirect to Login Page
  }, [navigate]);

  // Login function - saves user data and token
  const login = (data) => {
    const { access_token, user } = data;

    // Update State
    setToken(access_token);
    setUser(user);

    // Redirect to Dashboard
    navigate("/dashboard");
  };

  // Logout function - clears token and user data
  const logout = async () => {
    try {
      // Optional: Call the logout endpoint if implemented in the backend
      const response = await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn("Logout endpoint not found or failed:", response.statusText);
      }

      // Clear token and user state even if logout endpoint fails
      clearAuthData();
    } catch (error) {
      console.error("Logout error:", error);

      // Fallback: Clear data if backend fails
      clearAuthData();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
