import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Box,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const { login, token } = useContext(AuthContext); // Auth context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // Error state
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar visibility
  const navigate = useNavigate();

  // Redirect logged-in user directly to Dashboard
  useEffect(() => {
    // Avoid repeated navigation
    if (token) {
      navigate("/dashboard", { replace: true }); // Replace history to prevent looping
    }
  }, [token, navigate]);

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    try {
      // Make API call to login endpoint
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Required format
        },
        body: new URLSearchParams({
          username: email, // Must use 'username' as per FastAPI OAuth2 spec
          password: password,
        }),
      });

      const data = await response.json();

      // Successful login
      if (response.ok && data.access_token) {
        localStorage.setItem("token", data.access_token); // Save token for authenticated requests
        login(data.access_token); // Save token in AuthContext
      } else {
        // Handle errors from backend
        setError(data.detail || "Invalid email or password!");
        setSnackbarOpen(true); // Show Snackbar
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setSnackbarOpen(true); // Show Snackbar
      console.error(err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8, // Add bottom margin
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Login
        </Typography>

        {/* Login Form */}
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
            type={showPassword ? "text" : "password"}
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
            color="primary"
            sx={{ mt: 2, mb: 2 }}
          >
            Login
          </Button>
        </Box>

        {/* Links */}
        <Box mt={2}>
          <Typography>
            Don't have an account?{" "}
            <Link to="/register" className="link">
              Register
            </Link>
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Forgot your password?{" "}
            <Link to="/forgotpassword" className="link">
              Reset Password
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000} // Close after 3 seconds
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error" // Error severity
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
