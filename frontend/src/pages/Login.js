import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';

const Login = () => {
    const { login } = useContext(AuthContext); // Auth Context
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // To redirect user

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Show loading spinner

        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            setLoading(false);

            if (data.token) {
                login(data); // Save session
                navigate("/dashboard"); // Redirect to Dashboard
            } else {
                alert("Login failed!");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100vh"
            >
                <Typography variant="h4" marginBottom={2}>
                    Login
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                        style={{ marginTop: "16px" }}
                    >
                        {loading ? <CircularProgress size={24} /> : "Login"}
                    </Button>
                </form>

                {/* Links */}
                <Box marginTop={2}>
                    <Typography>
                        <Link to="/register">Create an account</Link>
                    </Typography>
                    <Typography>
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;
