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
        setError("");

        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                login(data); // Save token in context
                navigate("/dashboard"); // Redirect to Dashboard
            } else {
                setError(data.detail || "Invalid email or password!");
            }
        } catch (err) {
            setError("Login failed. Please try again.");
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
                {error && <Alert severity="error">{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 2 }}
                    >
                        Login
                    </Button>
                </Box>
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
