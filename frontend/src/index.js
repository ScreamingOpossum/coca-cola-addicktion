import React from "react";
import ReactDOM from "react-dom/client"; // Updated import for React 18
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // Import the AuthProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </AuthProvider>
);