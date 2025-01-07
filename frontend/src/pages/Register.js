import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
} from "@mui/material";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            setLoading(false);

            if (response.ok) {
                alert("Registration successful!");
            } else {
                alert("Failed to register!");
            }
        } catch (error) {
            console.error("Register Error:", error);
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box display="flex" flexDirection="column" alignItems="center" height="100vh">
                <Typography variant="h4" marginBottom={2}>
                    Register
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                    <TextField
                        label="First Name"
                        name="firstName"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Last Name"
                        name="lastName"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Email"
                        name="email"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                        style={{ marginTop: "16px" }}
                    >
                        {loading ? <CircularProgress size={24} /> : "Register"}
                    </Button>
                </form>
                <Box marginTop={2}>
                    <Typography>
                        Already have an account? <Link to="/login">Login</Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Register;
