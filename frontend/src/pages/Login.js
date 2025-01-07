import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Box,
    Alert,
    CircularProgress,
} from "@mui/material";

const Login = () => {
    const { login } = useContext(AuthContext); // Context for authentication
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors
        setLoading(true); // Show loading spinner

        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (data.token) {
                login(data); // Save token to context
            } else {
                setError(data.detail || "Login failed!"); // Show error message
            }
        } catch (error) {
            setError("Something went wrong. Please try again later.");
            console.error("Login Error:", error);
        } finally {
            setLoading(false); // Hide spinner
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                style={{
                    padding: "20px",
                    marginTop: "50px",
                    borderRadius: "10px",
                }}
            >
                <Typography variant="h5" align="center" gutterBottom>
                    Login
                </Typography>

                {error && (
                    <Alert severity="error" style={{ marginBottom: "10px" }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box mb={2}>
                        <TextField
                            label="Email Address"
                            variant="outlined"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Box>
                    <Box mb={2}>
                        <TextField
                            label="Password"
                            variant="outlined"
                            type="password"
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Box>
                    <Box mb={2}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Login"}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;
