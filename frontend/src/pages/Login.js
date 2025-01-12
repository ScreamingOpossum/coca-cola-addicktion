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

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email, // Must match FastAPI's OAuth2 schema
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        login({ access_token: data.access_token, user: { email } }); // Pass user info to context
      } else {
        setError(data.detail || "Invalid email or password!");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setSnackbarOpen(true);
      console.error(err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Login
        </Typography>

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

        {/* Links to Register and Forgot Password */}
        <Box mt={2}>
          <Typography>
            Don't have an account?{" "}
            <Link to="/register" style={{ textDecoration: "none", color: "#1976d2" }}>
              Register here
            </Link>
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Forgot your password?{" "}
            <Link to="/forgotpassword" style={{ textDecoration: "none", color: "#1976d2" }}>
              Reset it here
            </Link>
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          fontStyle: "italic",
          color: "gray",
          textAlign: "center",
          marginTop: 2,
        }}
      >
        "It's not an addiction until you've sucked d___ for it."
      </Typography>

      {/* Snackbar for Error Messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
