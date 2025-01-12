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
    } else {
      console.log("AuthContext: No token or user found in localStorage");
    }
  }, []);

  // Sync token and user with localStorage and Axios headers
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token); // Ensure Axios has the token
      console.log("AuthContext: Token updated in localStorage and Axios headers");
    } else {
      localStorage.removeItem("token");
      setAuthToken(null); // Clear Axios token
      console.log("AuthContext: Token cleared from localStorage and Axios headers");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      console.log("AuthContext: User updated in localStorage");
    } else {
      localStorage.removeItem("user");
      console.log("AuthContext: User cleared from localStorage");
    }
  }, [token, user]);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    console.log("AuthContext: Clearing authentication data...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setAuthToken(null); // Clear token from Axios headers
    navigate("/login");
  }, [navigate]);

  // Fetch user profile (to ensure data consistency)
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/user/profile");
      setUser(response.data); // Update user state with fresh profile data
      console.log("AuthContext: Fetched user profile:", response.data);
    } catch (error) {
      console.error("AuthContext: Error fetching user profile:", error);
      if (error.response?.status === 401) {
        clearAuthData(); // Clear data if the profile fetch fails due to auth issues
      }
    }
  }, [clearAuthData]);

  // Handle login
  const login = useCallback(
    async ({ access_token, user }) => {
      setToken(access_token);
      setUser(user);
      setAuthToken(access_token); // Set token in Axios headers
      console.log("AuthContext: User logged in:", user);

      navigate("/dashboard");

      // Optionally fetch fresh user profile after login
      try {
        await fetchUserProfile();
      } catch (error) {
        console.error("AuthContext: Failed to fetch user profile after login");
      }
    },
    [navigate, fetchUserProfile]
  );

  // Handle logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post("/auth/logout"); // Call logout API endpoint
        console.log("AuthContext: Successfully logged out from server");
      }
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
    } finally {
      clearAuthData(); // Always clear session data
    }
  }, [token, clearAuthData]);

  // Update user profile in state
  const updateUserProfile = useCallback(
    (updatedUser) => {
      setUser((prevUser) => ({
        ...prevUser,
        ...updatedUser,
      }));
      console.log("AuthContext: User profile updated in context:", updatedUser);
    },
    [setUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        fetchUserProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
