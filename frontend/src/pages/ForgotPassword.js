import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TextField, Button, Typography, Container, Box, Alert } from "@mui/material";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            // API Call to Backend (Replace with your actual endpoint)
            const response = await fetch("http://localhost:8000/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Password reset link has been sent to your email!");
            } else {
                setError(data.detail || "Failed to send reset link.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again later.");
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
                    Forgot Password
                </Typography>
                {message && <Alert severity="success">{message}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 2 }}
                    >
                        Send Reset Link
                    </Button>
                </Box>
                <Box mt={2}>
                    <Link to="/login">Back to Login</Link>
                </Box>
            </Box>
        </Container>
    );
};

export default ForgotPassword;
