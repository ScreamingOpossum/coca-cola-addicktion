import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const navigate = useNavigate();

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setAuthToken(savedToken); // Set token in Axios headers
    }
  }, []);

  // Sync token and user with localStorage and Axios headers
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token); // Ensure Axios has the token
    } else {
      localStorage.removeItem("token");
      setAuthToken(null); // Clear Axios token
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setAuthToken(null); // Clear token from Axios headers
    navigate("/login");
  }, [navigate]);

  // Handle login
  const login = useCallback(
    ({ access_token, user }) => {
      setToken(access_token);
      setUser(user);
      navigate("/dashboard");
    },
    [navigate]
  );

  // Handle logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post("/auth/logout"); // Call logout API endpoint
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData(); // Always clear session data
    }
  }, [token, clearAuthData]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
