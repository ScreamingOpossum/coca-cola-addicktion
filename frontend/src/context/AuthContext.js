import React, { createContext, useState, useEffect } from "react";

// Create Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);

  // Save token to localStorage
  const saveToken = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, saveToken, logout, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
