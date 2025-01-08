import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    TextField,
    Button,
    Typography,
    Container,
    Box,
    InputAdornment,
    IconButton,
    Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
    const { login } = useContext(AuthContext); // Use AuthContext for authentication
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Toggle password visibility
    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous error

        try {
            // Make API call using form-data format required by FastAPI OAuth2
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded", // Required format
                },
                body: new URLSearchParams({
                    username: email, // Must use 'username' instead of 'email'
                    password: password,
                }),
            });

            const data = await response.json();

            // Handle response
            if (response.ok && data.access_token) {
                login(data); // Save token in AuthContext
                navigate("/dashboard"); // Redirect to Dashboard
            } else {
                // Handle structured errors from backend
                if (Array.isArray(data.detail)) {
                    const errorMessage = data.detail
                        .map((err) => err.msg) // Extract error messages
                        .join(", ");
                    setError(errorMessage || "Invalid email or password!");
                } else {
                    setError(data.detail || "Invalid email or password!");
                }
            }
        } catch (err) {
            setError("Login failed. Please try again."); // Network or unexpected error
            console.error(err);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Typography component="h1" variant="h5" gutterBottom>
                    Login
                </Typography>

                {/* Display Errors */}
                {error && <Alert severity="error">{error}</Alert>}

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    {/* Email Input */}
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {/* Password Input */}
                    <TextField
                        fullWidth
                        label="Password"
                        variant="outlined"
                        margin="normal"
                        required
                        type={showPassword ? "text" : "password"} // Show/Hide Password
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleTogglePassword} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 2 }}
                    >
                        Login
                    </Button>
                </Box>

                {/* Links */}
                <Box mt={2}>
                    <Typography>
                        Don't have an account? <Link to="/register">Register</Link>
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                        Forgot your password? <Link to="/forgotpassword">Reset Password</Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;
